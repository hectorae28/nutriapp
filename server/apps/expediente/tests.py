import datetime
from datetime import timedelta

from django.contrib.auth.models import Group
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.catalogo.models import GrupoAlimento
from apps.expediente.models import (
    ExamenBioquimico,
    ExpedienteClinico,
    Notificacion,
    RegistroProgreso,
)
from apps.planes.models import PlanAlimenticio, RacionPlan, TiempoComida
from apps.users.models import Paciente
from apps.users.tests import make_paciente, make_user


class RegistroProgresoDetalleTest(TestCase):
    """IMC calculado y clasificación correcta"""

    def setUp(self):
        self.client = APIClient()
        Group.objects.get_or_create(name="Paciente")
        Group.objects.get_or_create(name="Nutricionista")
        self.paciente = make_paciente("pac_imc")
        self.nutri = make_user("nutri_imc", group_name="Nutricionista")

    def test_imc_normal(self):
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.post(
            "/api/registros-progreso/",
            {
                "paciente": self.paciente.pk,
                "fecha": "2025-01-01",
                "peso_kg": "60.0",
                "talla_cm": "165.0",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        # IMC = 60 / 1.65^2 = 22.04
        self.assertAlmostEqual(float(resp.data["imc"]), 22.04, delta=0.1)
        self.assertEqual(resp.data["imc_clasificacion"], "Normal")

    def test_imc_sobrepeso(self):
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.post(
            "/api/registros-progreso/",
            {
                "paciente": self.paciente.pk,
                "fecha": "2025-02-01",
                "peso_kg": "80.0",
                "talla_cm": "165.0",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        # IMC = 80 / 1.65^2 = 29.38
        self.assertEqual(resp.data["imc_clasificacion"], "Sobrepeso")

    def test_imc_null_sin_talla(self):
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.post(
            "/api/registros-progreso/",
            {
                "paciente": self.paciente.pk,
                "fecha": "2025-03-01",
                "peso_kg": "70.0",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        self.assertIsNone(resp.data["imc"])

    def test_listado_ordenado_por_fecha_desc(self):
        self.client.force_authenticate(user=self.nutri)
        for i, fecha in enumerate(["2025-01-01", "2025-03-01", "2025-02-01"]):
            self.client.post(
                "/api/registros-progreso/",
                {
                    "paciente": self.paciente.pk,
                    "fecha": fecha,
                    "peso_kg": str(70 + i),
                },
                format="json",
            )
        resp = self.client.get(f"/api/registros-progreso/?paciente={self.paciente.pk}")
        self.assertEqual(resp.status_code, 200)
        fechas = [r["fecha"] for r in resp.data]
        self.assertEqual(fechas, sorted(fechas, reverse=True))


class PlanAlimenticioAPITest(TestCase):
    """CRUD de planes y cálculos de macros vía API"""

    def setUp(self):
        self.client = APIClient()
        Group.objects.get_or_create(name="Paciente")
        Group.objects.get_or_create(name="Nutricionista")
        self.paciente = make_paciente("pac_plan_api")
        self.nutri = make_user("nutri_plan_api", group_name="Nutricionista")

    def test_nutricionista_crea_plan(self):
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.post(
            "/api/planes/",
            {
                "paciente": self.paciente.pk,
                "fecha_inicio": "2025-01-01",
                "activo": True,
                "kcal_objetivo": 1800,
                "pct_proteinas": "20.00",
                "pct_grasas": "25.00",
                "pct_carbohidratos": "55.00",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(float(resp.data["proteinas_g"]), 90.0)  # 1800*0.20/4
        self.assertAlmostEqual(
            float(resp.data["grasas_g"]), 50.0, delta=0.1
        )  # 1800*0.25/9
        self.assertEqual(float(resp.data["carbohidratos_g"]), 247.5)  # 1800*0.55/4

    def test_paciente_no_puede_crear_plan(self):
        self.client.force_authenticate(user=self.paciente.user)
        resp = self.client.post(
            "/api/planes/",
            {
                "paciente": self.paciente.pk,
                "fecha_inicio": "2025-01-01",
                "activo": True,
            },
            format="json",
        )
        self.assertIn(resp.status_code, [403, 401])

    def test_paciente_ve_solo_su_plan_activo(self):
        # Crear plan para este paciente
        PlanAlimenticio.objects.create(
            paciente=self.paciente,
            fecha_inicio=datetime.date(2025, 1, 1),
            activo=True,
            kcal_objetivo=2000,
        )
        # Crear otro paciente con su propio plan
        otro = make_paciente("pac_otro_plan")
        PlanAlimenticio.objects.create(
            paciente=otro,
            fecha_inicio=datetime.date(2025, 1, 1),
            activo=True,
            kcal_objetivo=1500,
        )
        self.client.force_authenticate(user=self.paciente.user)
        resp = self.client.get("/api/planes/")
        self.assertEqual(resp.status_code, 200)
        # Solo debe ver su propio plan
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["kcal_objetivo"], 2000)


class ExpedienteClinicoAPITest(TestCase):
    """CRUD de expediente clínico"""

    def setUp(self):
        self.client = APIClient()
        Group.objects.get_or_create(name="Paciente")
        Group.objects.get_or_create(name="Nutricionista")
        self.paciente = make_paciente("pac_expediente")
        self.nutri = make_user("nutri_expediente", group_name="Nutricionista")

    def test_nutricionista_crea_expediente(self):
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.post(
            "/api/expedientes/",
            {
                "paciente": self.paciente.pk,
                "motivo_consulta": "Pérdida de peso",
                "ant_personales": "Hipertensión controlada",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["motivo_consulta"], "Pérdida de peso")

    def test_paciente_lee_su_expediente(self):
        # Crear expediente
        ExpedienteClinico.objects.create(
            paciente=self.paciente,
            motivo_consulta="Control de peso",
        )
        self.client.force_authenticate(user=self.paciente.user)
        resp = self.client.get("/api/expedientes/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["motivo_consulta"], "Control de peso")

    def test_paciente_no_puede_crear_expediente(self):
        self.client.force_authenticate(user=self.paciente.user)
        resp = self.client.post(
            "/api/expedientes/",
            {
                "paciente": self.paciente.pk,
                "motivo_consulta": "Test",
            },
            format="json",
        )
        self.assertIn(resp.status_code, [403, 401])


class Sprint6FiltrosAPITest(TestCase):
    """Tests para Sprint 6: Filtros por paciente en endpoints"""

    def setUp(self):
        self.client = APIClient()
        Group.objects.get_or_create(name="Paciente")
        Group.objects.get_or_create(name="Nutricionista")

        # Crear nutricionista
        self.nutri = make_user("nutri_filtros", group_name="Nutricionista")

        # Crear dos pacientes
        self.paciente1 = make_paciente("pac_filtros_1")
        self.paciente2 = make_paciente("pac_filtros_2")

        # Crear expedientes para ambos pacientes
        self.expediente1 = ExpedienteClinico.objects.create(
            paciente=self.paciente1,
            motivo_consulta="Diabetes tipo 2",
            ant_personales="Hipertensión",
        )
        self.expediente2 = ExpedienteClinico.objects.create(
            paciente=self.paciente2,
            motivo_consulta="Obesidad",
            ant_personales="Sedentarismo",
        )

        # Crear registros de progreso
        RegistroProgreso.objects.create(
            paciente=self.paciente1,
            fecha=datetime.date(2025, 1, 15),
            peso_kg=85.5,
            talla_cm=170.0,
            creado_por=self.nutri,
        )
        RegistroProgreso.objects.create(
            paciente=self.paciente1,
            fecha=datetime.date(2025, 2, 1),
            peso_kg=83.0,
            talla_cm=170.0,
            creado_por=self.nutri,
        )
        RegistroProgreso.objects.create(
            paciente=self.paciente2,
            fecha=datetime.date(2025, 1, 20),
            peso_kg=95.0,
            talla_cm=165.0,
            creado_por=self.nutri,
        )

        # Crear exámenes bioquímicos
        ExamenBioquimico.objects.create(
            paciente=self.paciente1,
            fecha=datetime.date(2025, 1, 10),
            glucosa=126.5,
            hemoglobina_glicosilada=7.2,
            colesterol=220.0,
            ldl=140.0,
            hdl=45.0,
            trigliceridos=180.0,
        )
        ExamenBioquimico.objects.create(
            paciente=self.paciente1,
            fecha=datetime.date(2025, 2, 10),
            glucosa=115.0,
            hemoglobina_glicosilada=6.8,
            colesterol=200.0,
            ldl=130.0,
            hdl=50.0,
            trigliceridos=160.0,
        )
        ExamenBioquimico.objects.create(
            paciente=self.paciente2,
            fecha=datetime.date(2025, 1, 15),
            glucosa=100.0,
            colesterol=190.0,
            ldl=120.0,
            hdl=55.0,
            trigliceridos=140.0,
        )

    def test_nutricionista_obtiene_expediente_por_paciente(self):
        """Test: Nutricionista puede obtener expediente de un paciente específico"""
        self.client.force_authenticate(user=self.nutri)

        # Filtrar expediente del paciente 1
        resp = self.client.get(f"/api/expedientes/?paciente={self.paciente1.pk}")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["motivo_consulta"], "Diabetes tipo 2")
        self.assertEqual(resp.data[0]["paciente"], self.paciente1.pk)

        # Filtrar expediente del paciente 2
        resp = self.client.get(f"/api/expedientes/?paciente={self.paciente2.pk}")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["motivo_consulta"], "Obesidad")
        self.assertEqual(resp.data[0]["paciente"], self.paciente2.pk)

        # Sin filtro, debe ver todos
        resp = self.client.get("/api/expedientes/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 2)

    def test_nutricionista_ve_registros_progreso_filtrados_por_paciente(self):
        """Test: Nutricionista puede ver registros de progreso filtrados por paciente"""
        self.client.force_authenticate(user=self.nutri)

        # Filtrar registros del paciente 1 (debe tener 2)
        resp = self.client.get(f"/api/registros-progreso/?paciente={self.paciente1.pk}")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 2)
        # Verificar que todos los registros pertenecen al paciente 1
        for registro in resp.data:
            self.assertEqual(registro["paciente"], self.paciente1.pk)
        # Verificar ordenamiento por fecha descendente
        self.assertEqual(resp.data[0]["fecha"], "2025-02-01")
        self.assertEqual(resp.data[1]["fecha"], "2025-01-15")

        # Filtrar registros del paciente 2 (debe tener 1)
        resp = self.client.get(f"/api/registros-progreso/?paciente={self.paciente2.pk}")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["paciente"], self.paciente2.pk)

        # Sin filtro, debe ver todos (3 registros)
        resp = self.client.get("/api/registros-progreso/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 3)

    def test_nutricionista_ve_examenes_bioquimicos_filtrados_por_paciente(self):
        """Test: Nutricionista puede ver exámenes bioquímicos filtrados por paciente"""
        self.client.force_authenticate(user=self.nutri)

        # Filtrar exámenes del paciente 1 (debe tener 2)
        resp = self.client.get(
            f"/api/examenes-bioquimicos/?paciente={self.paciente1.pk}"
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 2)
        # Verificar que todos los exámenes pertenecen al paciente 1
        for examen in resp.data:
            self.assertEqual(examen["paciente"], self.paciente1.pk)
        # Verificar ordenamiento por fecha descendente
        self.assertEqual(resp.data[0]["fecha"], "2025-02-10")
        self.assertEqual(resp.data[1]["fecha"], "2025-01-10")
        # Verificar campos y alias
        self.assertEqual(float(resp.data[0]["glucosa"]), 115.0)
        self.assertEqual(float(resp.data[0]["glucosa_mg_dl"]), 115.0)
        self.assertEqual(float(resp.data[0]["hba1c"]), 6.8)
        self.assertEqual(float(resp.data[0]["colesterol_total"]), 200.0)

        # Filtrar exámenes del paciente 2 (debe tener 1)
        resp = self.client.get(
            f"/api/examenes-bioquimicos/?paciente={self.paciente2.pk}"
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["paciente"], self.paciente2.pk)

        # Sin filtro, debe ver todos (3 exámenes)
        resp = self.client.get("/api/examenes-bioquimicos/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 3)

    def test_paciente_solo_ve_sus_propios_datos(self):
        """Test: Paciente solo puede ver sus propios datos (no los de otros)"""
        self.client.force_authenticate(user=self.paciente1.user)

        # Expediente: debe ver solo el suyo
        resp = self.client.get("/api/expedientes/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["paciente"], self.paciente1.pk)

        # Registros de progreso: debe ver solo los suyos (2)
        resp = self.client.get("/api/registros-progreso/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 2)
        for registro in resp.data:
            self.assertEqual(registro["paciente"], self.paciente1.pk)

        # Exámenes bioquímicos: debe ver solo los suyos (2)
        resp = self.client.get("/api/examenes-bioquimicos/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 2)
        for examen in resp.data:
            self.assertEqual(examen["paciente"], self.paciente1.pk)


class MetricasNutricionistaTest(TestCase):
    """Tests para Sprint 8: Métricas del nutricionista"""

    def setUp(self):
        self.client = APIClient()
        Group.objects.get_or_create(name="Paciente")
        Group.objects.get_or_create(name="Nutricionista")

        self.nutri = make_user("nutri_metricas", group_name="Nutricionista")
        self.paciente1 = make_paciente("pac_metricas_1")
        self.paciente2 = make_paciente("pac_metricas_2")

        # Crear planes activos
        PlanAlimenticio.objects.create(
            paciente=self.paciente1,
            fecha_inicio=datetime.date(2025, 1, 1),
            activo=True,
            tipo_dieta="Hipocalórica",
        )
        PlanAlimenticio.objects.create(
            paciente=self.paciente2,
            fecha_inicio=datetime.date(2025, 1, 5),
            activo=True,
            tipo_dieta="Mediterránea",
        )

        # Crear registros de progreso recientes
        RegistroProgreso.objects.create(
            paciente=self.paciente1,
            fecha=datetime.date.today(),
            peso_kg=70.0,
            talla_cm=165.0,
            creado_por=self.nutri,
        )

        # Crear examen bioquímico este mes
        ExamenBioquimico.objects.create(
            paciente=self.paciente1, fecha=datetime.date.today(), glucosa=100.0
        )

    def test_metricas_nutricionista_retorna_estructura(self):
        """Test: Endpoint de métricas retorna estructura completa"""
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.get("/api/metricas-nutricionista/")

        self.assertEqual(resp.status_code, 200)

        # Verificar campos presentes
        self.assertIn("total_pacientes", resp.data)
        self.assertIn("pacientes_activos", resp.data)
        self.assertIn("planes_activos", resp.data)
        self.assertIn("consultas_este_mes", resp.data)
        self.assertIn("nuevos_pacientes_mes", resp.data)
        self.assertIn("examenes_este_mes", resp.data)
        self.assertIn("pacientes_con_progreso_reciente", resp.data)
        self.assertIn("distribucion_tipo_dieta", resp.data)

        # Verificar valores
        self.assertEqual(resp.data["total_pacientes"], 2)
        self.assertEqual(resp.data["pacientes_activos"], 2)
        self.assertEqual(resp.data["planes_activos"], 2)
        self.assertGreaterEqual(resp.data["consultas_este_mes"], 1)
        self.assertGreaterEqual(resp.data["examenes_este_mes"], 1)

        # Verificar distribución de dietas
        self.assertIsInstance(resp.data["distribucion_tipo_dieta"], dict)


class ReportePacienteTest(TestCase):
    """Tests para Sprint 8: Reporte completo de paciente"""

    def setUp(self):
        self.client = APIClient()
        Group.objects.get_or_create(name="Paciente")
        Group.objects.get_or_create(name="Nutricionista")

        self.nutri = make_user("nutri_reporte", group_name="Nutricionista")
        self.paciente = make_paciente("pac_reporte")

        # Crear expediente
        ExpedienteClinico.objects.create(
            paciente=self.paciente, motivo_consulta="Control de peso"
        )

        # Crear plan activo
        plan = PlanAlimenticio.objects.create(
            paciente=self.paciente,
            fecha_inicio=datetime.date(2025, 1, 1),
            activo=True,
            tipo_dieta="Balanceada",
            kcal_objetivo=2000,
        )

        # Crear registros de progreso
        RegistroProgreso.objects.create(
            paciente=self.paciente,
            fecha=datetime.date(2025, 1, 1),
            peso_kg=80.0,
            talla_cm=170.0,
            creado_por=self.nutri,
        )
        RegistroProgreso.objects.create(
            paciente=self.paciente,
            fecha=datetime.date(2025, 2, 1),
            peso_kg=78.0,
            talla_cm=170.0,
            creado_por=self.nutri,
        )

        # Crear examen bioquímico
        ExamenBioquimico.objects.create(
            paciente=self.paciente, fecha=datetime.date(2025, 1, 15), glucosa=95.0
        )

    def test_reporte_paciente_datos_completos(self):
        """Test: Reporte de paciente retorna datos completos"""
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.get(f"/api/reporte-paciente/{self.paciente.pk}/")

        self.assertEqual(resp.status_code, 200)

        # Verificar estructura
        self.assertIn("paciente", resp.data)
        self.assertIn("expediente", resp.data)
        self.assertIn("plan_activo", resp.data)
        self.assertIn("progreso", resp.data)
        self.assertIn("examenes", resp.data)

        # Verificar datos del paciente
        self.assertEqual(resp.data["paciente"]["id"], self.paciente.pk)
        self.assertIn("imc", resp.data["paciente"])

        # Verificar expediente
        self.assertIsNotNone(resp.data["expediente"])
        self.assertEqual(resp.data["expediente"]["motivo_consulta"], "Control de peso")

        # Verificar plan activo
        self.assertIsNotNone(resp.data["plan_activo"])
        self.assertEqual(resp.data["plan_activo"]["tipo_dieta"], "Balanceada")

        # Verificar progreso (debe tener 2 registros)
        self.assertEqual(len(resp.data["progreso"]), 2)

        # Verificar exámenes (debe tener 1)
        self.assertEqual(len(resp.data["examenes"]), 1)

    def test_reporte_paciente_no_encontrado(self):
        """Test: Reporte de paciente inexistente retorna 404"""
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.get("/api/reporte-paciente/9999/")

        self.assertEqual(resp.status_code, 404)


class AdherenciaTest(TestCase):
    """Tests para Sprint 8: Adherencia al plan"""

    def setUp(self):
        self.client = APIClient()
        Group.objects.get_or_create(name="Paciente")
        Group.objects.get_or_create(name="Nutricionista")

        self.nutri = make_user("nutri_adherencia", group_name="Nutricionista")
        self.paciente = make_paciente("pac_adherencia")

        # Crear registros en 4 semanas distintas de las últimas 8
        from django.utils import timezone

        now = timezone.now()

        # Semana 1 (más reciente)
        RegistroProgreso.objects.create(
            paciente=self.paciente,
            fecha=(now - timedelta(days=2)).date(),
            peso_kg=75.0,
            talla_cm=170.0,
            creado_por=self.nutri,
        )

        # Semana 3
        RegistroProgreso.objects.create(
            paciente=self.paciente,
            fecha=(now - timedelta(weeks=3, days=1)).date(),
            peso_kg=76.0,
            talla_cm=170.0,
            creado_por=self.nutri,
        )

        # Semana 5
        RegistroProgreso.objects.create(
            paciente=self.paciente,
            fecha=(now - timedelta(weeks=5, days=2)).date(),
            peso_kg=77.0,
            talla_cm=170.0,
            creado_por=self.nutri,
        )

        # Semana 7
        RegistroProgreso.objects.create(
            paciente=self.paciente,
            fecha=(now - timedelta(weeks=7, days=3)).date(),
            peso_kg=78.0,
            talla_cm=170.0,
            creado_por=self.nutri,
        )

    def test_adherencia_calcula_correctamente(self):
        """Test: Adherencia se calcula correctamente"""
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.get(
            f"/api/adherencia/?paciente={self.paciente.pk}&semanas=8"
        )

        self.assertEqual(resp.status_code, 200)

        # Verificar estructura
        self.assertIn("paciente_id", resp.data)
        self.assertIn("semanas_evaluadas", resp.data)
        self.assertIn("semanas_con_registro", resp.data)
        self.assertIn("porcentaje_adherencia", resp.data)

        # Verificar valores
        self.assertEqual(resp.data["semanas_evaluadas"], 8)
        self.assertEqual(resp.data["semanas_con_registro"], 4)
        self.assertEqual(resp.data["porcentaje_adherencia"], 50.0)

    def test_adherencia_sin_parametro_paciente(self):
        """Test: Adherencia sin parámetro paciente retorna error"""
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.get("/api/adherencia/")

        self.assertEqual(resp.status_code, 400)


class ComparativaTest(TestCase):
    """Tests para Sprint 8: Comparativa de pacientes"""

    def setUp(self):
        self.client = APIClient()
        Group.objects.get_or_create(name="Paciente")
        Group.objects.get_or_create(name="Nutricionista")

        self.nutri = make_user("nutri_comparativa", group_name="Nutricionista")
        self.paciente1 = make_paciente("pac_comp_1")
        self.paciente2 = make_paciente("pac_comp_2")

        # Paciente 1: registros de progreso
        RegistroProgreso.objects.create(
            paciente=self.paciente1,
            fecha=datetime.date(2025, 1, 1),
            peso_kg=85.0,
            talla_cm=170.0,
            creado_por=self.nutri,
        )
        RegistroProgreso.objects.create(
            paciente=self.paciente1,
            fecha=datetime.date(2025, 2, 1),
            peso_kg=80.0,
            talla_cm=170.0,
            creado_por=self.nutri,
        )

        # Paciente 2: registros de progreso
        RegistroProgreso.objects.create(
            paciente=self.paciente2,
            fecha=datetime.date(2025, 1, 5),
            peso_kg=70.0,
            talla_cm=165.0,
            creado_por=self.nutri,
        )

        # Plan activo para paciente 1
        PlanAlimenticio.objects.create(
            paciente=self.paciente1,
            fecha_inicio=datetime.date(2025, 1, 1),
            activo=True,
            tipo_dieta="Hipocalórica",
        )

    def test_comparativa_pacientes_lista(self):
        """Test: Comparativa de pacientes retorna lista con campos esperados"""
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.get("/api/comparativa-pacientes/")

        self.assertEqual(resp.status_code, 200)
        self.assertIsInstance(resp.data, list)
        self.assertGreaterEqual(len(resp.data), 2)

        # Verificar estructura de cada elemento
        for item in resp.data:
            self.assertIn("paciente_id", item)
            self.assertIn("nombre", item)
            self.assertIn("peso_inicial", item)
            self.assertIn("peso_actual", item)
            self.assertIn("diferencia_kg", item)
            self.assertIn("plan_activo", item)
            self.assertIn("plan_tipo_dieta", item)
            self.assertIn("adherencia_pct", item)
            self.assertIn("ultimo_registro", item)

        # Verificar datos del paciente 1
        pac1_data = next(
            (p for p in resp.data if p["paciente_id"] == self.paciente1.pk), None
        )
        self.assertIsNotNone(pac1_data)
        self.assertEqual(pac1_data["peso_inicial"], 85.0)
        self.assertEqual(pac1_data["peso_actual"], 80.0)
        self.assertEqual(pac1_data["diferencia_kg"], -5.0)
        self.assertEqual(pac1_data["plan_tipo_dieta"], "Hipocalórica")


class NotificacionesAPITest(TestCase):
    """Tests para el sistema de notificaciones"""

    def setUp(self):
        self.client = APIClient()
        Group.objects.get_or_create(name="Paciente")
        Group.objects.get_or_create(name="Nutricionista")
        self.nutri = make_user("nutri_notif", group_name="Nutricionista")
        self.paciente = make_paciente("pac_notif")
        self.paciente2 = make_paciente("pac_notif2")

    def test_notificaciones_usuario_autenticado(self):
        """GET /api/notificaciones/ retorna estructura correcta"""
        # Crear un plan activo para evitar alertas automáticas de sin_plan
        PlanAlimenticio.objects.create(
            paciente=self.paciente, fecha_inicio=timezone.now().date(), activo=True
        )
        PlanAlimenticio.objects.create(
            paciente=self.paciente2, fecha_inicio=timezone.now().date(), activo=True
        )

        # Crear registros recientes para evitar alertas de sin_progreso
        RegistroProgreso.objects.create(
            paciente=self.paciente,
            fecha=timezone.now().date(),
            peso_kg=70.0,
            creado_por=self.nutri,
        )
        RegistroProgreso.objects.create(
            paciente=self.paciente2,
            fecha=timezone.now().date(),
            peso_kg=75.0,
            creado_por=self.nutri,
        )

        # Crear notificación manual para el nutricionista
        Notificacion.objects.create(
            destinatario=self.nutri,
            tipo="sistema",
            titulo="Test notificación",
            mensaje="Mensaje de prueba",
            paciente=self.paciente,
        )

        self.client.force_authenticate(user=self.nutri)
        resp = self.client.get("/api/notificaciones/")
        self.assertEqual(resp.status_code, 200)

        # Verificar estructura de respuesta
        self.assertIn("total_no_leidas", resp.data)
        self.assertIn("notificaciones", resp.data)
        self.assertGreaterEqual(resp.data["total_no_leidas"], 1)
        self.assertGreaterEqual(len(resp.data["notificaciones"]), 1)

        # Verificar campos de notificación
        notif = resp.data["notificaciones"][0]
        self.assertIn("id", notif)
        self.assertIn("tipo", notif)
        self.assertIn("titulo", notif)
        self.assertIn("mensaje", notif)
        self.assertIn("leida", notif)
        self.assertIn("paciente", notif)
        self.assertIn("created_at", notif)

    def test_marcar_notificacion_leida(self):
        """PATCH /api/notificaciones/{id}/leer/ cambia leida=True"""
        notif = Notificacion.objects.create(
            destinatario=self.nutri,
            tipo="sistema",
            titulo="Test",
            mensaje="Test mensaje",
            leida=False,
        )

        self.client.force_authenticate(user=self.nutri)
        resp = self.client.patch(f"/api/notificaciones/{notif.pk}/leer/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["leida"], True)

        # Verificar en BD
        notif.refresh_from_db()
        self.assertTrue(notif.leida)

    def test_marcar_todas_leidas(self):
        """POST /api/notificaciones/marcar-todas-leidas/ funciona"""
        # Crear varias notificaciones no leídas
        for i in range(3):
            Notificacion.objects.create(
                destinatario=self.nutri,
                tipo="sistema",
                titulo=f"Notif {i}",
                mensaje="Test",
                leida=False,
            )

        self.client.force_authenticate(user=self.nutri)
        resp = self.client.post("/api/notificaciones/marcar_todas_leidas/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["actualizadas"], 3)

        # Verificar que todas están leídas
        count_no_leidas = Notificacion.objects.filter(
            destinatario=self.nutri, leida=False
        ).count()
        self.assertEqual(count_no_leidas, 0)

    def test_generador_alerta_sin_progreso(self):
        """Paciente sin registros genera notificación automática para nutricionista"""
        # Crear registro antiguo (>14 días)
        fecha_antigua = timezone.now().date() - timedelta(days=20)
        RegistroProgreso.objects.create(
            paciente=self.paciente,
            fecha=fecha_antigua,
            peso_kg=70.0,
            creado_por=self.nutri,
        )

        # Llamar al endpoint GET que genera alertas
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.get("/api/notificaciones/")
        self.assertEqual(resp.status_code, 200)

        # Verificar que se generó la alerta
        notif_sin_progreso = Notificacion.objects.filter(
            destinatario=self.nutri, tipo="sin_progreso", paciente=self.paciente
        ).first()
        self.assertIsNotNone(notif_sin_progreso)
        self.assertIn("días sin registrar", notif_sin_progreso.mensaje)

    def test_paciente_solo_ve_sus_notificaciones(self):
        """Paciente no puede ver notificaciones del nutricionista"""
        # Crear registro reciente para evitar alertas automáticas
        RegistroProgreso.objects.create(
            paciente=self.paciente,
            fecha=timezone.now().date(),
            peso_kg=70.0,
            creado_por=self.nutri,
        )

        # Crear notificación para nutricionista
        Notificacion.objects.create(
            destinatario=self.nutri,
            tipo="sistema",
            titulo="Solo para nutricionista",
            mensaje="No visible para paciente",
        )

        # Crear notificación para paciente
        Notificacion.objects.create(
            destinatario=self.paciente.user,
            tipo="sistema",
            titulo="Solo para paciente",
            mensaje="Visible para paciente",
            paciente=self.paciente,
        )

        # Login como paciente
        self.client.force_authenticate(user=self.paciente.user)
        resp = self.client.get("/api/notificaciones/")
        self.assertEqual(resp.status_code, 200)

        # Solo debe ver su propia notificación
        self.assertEqual(len(resp.data["notificaciones"]), 1)
        self.assertEqual(resp.data["notificaciones"][0]["titulo"], "Solo para paciente")

    def test_filtro_no_leidas(self):
        """Parámetro ?no_leidas=true filtra correctamente"""
        # Crear planes activos para evitar alertas automáticas
        PlanAlimenticio.objects.create(
            paciente=self.paciente, fecha_inicio=timezone.now().date(), activo=True
        )
        PlanAlimenticio.objects.create(
            paciente=self.paciente2, fecha_inicio=timezone.now().date(), activo=True
        )

        # Crear registros recientes para evitar alertas de sin_progreso
        RegistroProgreso.objects.create(
            paciente=self.paciente,
            fecha=timezone.now().date(),
            peso_kg=70.0,
            creado_por=self.nutri,
        )
        RegistroProgreso.objects.create(
            paciente=self.paciente2,
            fecha=timezone.now().date(),
            peso_kg=75.0,
            creado_por=self.nutri,
        )

        # Crear exámenes recientes para evitar alertas de examen_pendiente
        ExamenBioquimico.objects.create(
            paciente=self.paciente, fecha=timezone.now().date()
        )
        ExamenBioquimico.objects.create(
            paciente=self.paciente2, fecha=timezone.now().date()
        )

        # Crear notificaciones mezcladas
        Notificacion.objects.create(
            destinatario=self.nutri,
            tipo="sistema",
            titulo="No leída",
            mensaje="Test",
            leida=False,
        )
        Notificacion.objects.create(
            destinatario=self.nutri,
            tipo="sistema",
            titulo="Leída",
            mensaje="Test",
            leida=True,
        )

        self.client.force_authenticate(user=self.nutri)
        resp = self.client.get("/api/notificaciones/?no_leidas=true")
        self.assertEqual(resp.status_code, 200)

        # Solo debe retornar las no leídas
        self.assertEqual(len(resp.data["notificaciones"]), 1)
        # Verificar que todas son no leídas
        for notif in resp.data["notificaciones"]:
            self.assertFalse(notif["leida"])

    def test_alerta_paciente_sin_progreso_7_dias(self):
        """Paciente sin progreso en 7 días genera alerta para él mismo"""
        # Crear registro antiguo (>7 días)
        fecha_antigua = timezone.now().date() - timedelta(days=10)
        RegistroProgreso.objects.create(
            paciente=self.paciente,
            fecha=fecha_antigua,
            peso_kg=70.0,
            creado_por=self.nutri,
        )

        # Login como paciente y obtener notificaciones
        self.client.force_authenticate(user=self.paciente.user)
        resp = self.client.get("/api/notificaciones/")
        self.assertEqual(resp.status_code, 200)

        # Verificar que se generó la alerta
        notif = Notificacion.objects.filter(
            destinatario=self.paciente.user, tipo="sin_progreso"
        ).first()
        self.assertIsNotNone(notif)
        self.assertIn("Recuerda registrar tu peso", notif.mensaje)

    def test_no_duplicar_alertas_sin_progreso(self):
        """No debe crear múltiples alertas del mismo tipo si ya existe una no leída"""
        # Crear registro antiguo
        fecha_antigua = timezone.now().date() - timedelta(days=20)
        RegistroProgreso.objects.create(
            paciente=self.paciente,
            fecha=fecha_antigua,
            peso_kg=70.0,
            creado_por=self.nutri,
        )

        self.client.force_authenticate(user=self.nutri)

        # Primera llamada - debe crear alerta
        resp1 = self.client.get("/api/notificaciones/")
        count1 = Notificacion.objects.filter(
            destinatario=self.nutri,
            tipo="sin_progreso",
            paciente=self.paciente,
            leida=False,
        ).count()
        self.assertEqual(count1, 1)

        # Segunda llamada - NO debe crear otra alerta
        resp2 = self.client.get("/api/notificaciones/")
        count2 = Notificacion.objects.filter(
            destinatario=self.nutri,
            tipo="sin_progreso",
            paciente=self.paciente,
            leida=False,
        ).count()
        self.assertEqual(count2, 1)  # Sigue siendo 1, no se duplicó


# ── Sprint 10 - Coverage adicional ───────────────────────────────────────────


class ViewsCoverageTest(TestCase):
    """Tests adicionales para cobertura de views.py"""

    def setUp(self):
        self.client = APIClient()
        Group.objects.get_or_create(name="Nutricionista")
        Group.objects.get_or_create(name="Paciente")
        self.nutri = make_user("nutri_views", group_name="Nutricionista")
        self.paciente = make_paciente("pac_views")

    def test_examen_bioquimico_create_como_paciente_denegado(self):
        """Paciente no puede crear exámenes bioquímicos (línea 78)"""
        self.client.force_authenticate(user=self.paciente.user)
        resp = self.client.post(
            "/api/examenes-bioquimicos/",
            {
                "paciente": self.paciente.pk,
                "fecha": "2025-01-01",
                "glucosa": 90.0,
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_examen_bioquimico_filtrado_por_paciente_query(self):
        """Filtrar exámenes por paciente usando query param (líneas 72-73)"""
        pac2 = make_paciente("pac2_views")

        ExamenBioquimico.objects.create(
            paciente=self.paciente, fecha="2025-01-01", glucosa=90.0
        )
        ExamenBioquimico.objects.create(paciente=pac2, fecha="2025-01-02", glucosa=95.0)

        self.client.force_authenticate(user=self.nutri)
        resp = self.client.get(
            f"/api/examenes-bioquimicos/?paciente={self.paciente.pk}"
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["paciente"], self.paciente.pk)

    def test_notificacion_examen_pendiente_sin_examen_con_registros(self):
        """Alerta de examen pendiente cuando tiene registros pero nunca tuvo examen (líneas 172-179)"""
        # Crear registro para el paciente
        RegistroProgreso.objects.create(
            paciente=self.paciente,
            fecha=timezone.now().date() - timedelta(days=5),
            peso_kg=70.0,
            creado_por=self.nutri,
        )

        # Login como nutricionista - genera alertas
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.get("/api/notificaciones/")
        self.assertEqual(resp.status_code, 200)

        # Verificar que se generó alerta de examen pendiente
        notif = Notificacion.objects.filter(
            destinatario=self.nutri, tipo="examen_pendiente", paciente=self.paciente
        ).first()
        self.assertIsNotNone(notif)

    def test_notificacion_examen_pendiente_mas_90_dias(self):
        """Alerta cuando último examen fue hace más de 90 días (líneas 157-165)"""
        # Crear examen antiguo
        fecha_antigua = timezone.now().date() - timedelta(days=100)
        ExamenBioquimico.objects.create(
            paciente=self.paciente, fecha=fecha_antigua, glucosa=90.0
        )

        # Login como nutricionista - genera alertas
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.get("/api/notificaciones/")
        self.assertEqual(resp.status_code, 200)

        # Verificar que se generó alerta
        notif = Notificacion.objects.filter(
            destinatario=self.nutri,
            tipo="examen_pendiente",
            paciente=self.paciente,
            leida=False,
        ).first()
        self.assertIsNotNone(notif)
        self.assertIn("3 meses", notif.mensaje)


class RecordatorioAlimentarioCoverageTest(TestCase):
    """Tests adicionales para RecordatorioAlimentario"""

    def setUp(self):
        self.client = APIClient()
        Group.objects.get_or_create(name="Nutricionista")
        Group.objects.get_or_create(name="Paciente")
        self.nutri = make_user("nutri_rec", group_name="Nutricionista")
        self.paciente = make_paciente("pac_rec")

    def test_recordatorio_filtrado_por_paciente(self):
        """Filtrar recordatorios por paciente (líneas 91-94)"""
        from apps.expediente.models import RecordatorioAlimentario

        pac2 = make_paciente("pac2_rec")

        rec1 = RecordatorioAlimentario.objects.create(
            paciente=self.paciente, fecha="2025-01-01"
        )
        rec2 = RecordatorioAlimentario.objects.create(paciente=pac2, fecha="2025-01-02")

        self.client.force_authenticate(user=self.nutri)
        resp = self.client.get(f"/api/recordatorios/?paciente={self.paciente.pk}")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["id"], rec1.pk)

    def test_paciente_solo_ve_sus_recordatorios(self):
        """Paciente solo ve sus propios recordatorios (líneas 89-90)"""
        from apps.expediente.models import RecordatorioAlimentario

        pac2 = make_paciente("pac2_rec_own")

        rec1 = RecordatorioAlimentario.objects.create(
            paciente=self.paciente, fecha="2025-01-01"
        )
        rec2 = RecordatorioAlimentario.objects.create(paciente=pac2, fecha="2025-01-02")

        self.client.force_authenticate(user=self.paciente.user)
        resp = self.client.get("/api/recordatorios/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["id"], rec1.pk)


# ── Sprint 13 - Tests de Regresión ──────────────────────────────────────────


class Sprint13ContexturaNullableTest(TestCase):
    """Q1 Sprint 13 — Contextura nullable en ExpedienteClinico"""

    def setUp(self):
        self.client = APIClient()
        Group.objects.get_or_create(name="Nutricionista")
        Group.objects.get_or_create(name="Paciente")
        self.nutri = make_user("nutri_s13_ctx", group_name="Nutricionista")
        self.paciente = make_paciente("pac_s13_ctx")
        self.expediente = ExpedienteClinico.objects.create(
            paciente=self.paciente,
            motivo_consulta="Control",
            contextura="mediana",
        )

    def test_contextura_puede_ser_null(self):
        """PATCH con contextura=null debe retornar 200 y aceptar el valor"""
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.patch(
            f"/api/expedientes/{self.expediente.pk}/",
            {"contextura": None},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertIsNone(resp.data["contextura"])

        # Verificar en BD
        self.expediente.refresh_from_db()
        self.assertIsNone(self.expediente.contextura)


class Sprint13CamposCausaTGTest(TestCase):
    """Q4 Sprint 13 — Campos _causa para trastornos GI"""

    def setUp(self):
        self.client = APIClient()
        Group.objects.get_or_create(name="Nutricionista")
        Group.objects.get_or_create(name="Paciente")
        self.nutri = make_user("nutri_s13_causa", group_name="Nutricionista")
        self.paciente = make_paciente("pac_s13_causa")
        self.expediente = ExpedienteClinico.objects.create(
            paciente=self.paciente,
            motivo_consulta="Control",
        )

    def test_guardar_y_recuperar_tg_causa(self):
        """PATCH con tg_dispepsia_causa debe persistir y retornar correctamente"""
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.patch(
            f"/api/expedientes/{self.expediente.pk}/",
            {
                "tg_dispepsia": True,
                "tg_dispepsia_causa": "Estrés crónico",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.data["tg_dispepsia"])
        self.assertEqual(resp.data["tg_dispepsia_causa"], "Estrés crónico")

        # Verificar en BD
        self.expediente.refresh_from_db()
        self.assertTrue(self.expediente.tg_dispepsia)
        self.assertEqual(self.expediente.tg_dispepsia_causa, "Estrés crónico")

    def test_todos_campos_causa_disponibles(self):
        """Verificar que los 8 campos _causa están en el serializer"""
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.get(f"/api/expedientes/{self.expediente.pk}/")
        self.assertEqual(resp.status_code, 200)

        # Verificar que todos los campos _causa están presentes
        campos_causa = [
            "tg_dispepsia_causa",
            "tg_distension_causa",
            "tg_aerofagia_causa",
            "tg_meteorismo_causa",
            "tg_diarrea_causa",
            "tg_nauseas_causa",
            "tg_vomitos_causa",
            "tg_rgef_causa",
        ]
        for campo in campos_causa:
            self.assertIn(campo, resp.data)


class Sprint13RecordatorioNestedWriteTest(TestCase):
    """Q3 Sprint 13 — RecordatorioAlimentario nested write"""

    def setUp(self):
        self.client = APIClient()
        Group.objects.get_or_create(name="Nutricionista")
        Group.objects.get_or_create(name="Paciente")
        self.nutri = make_user("nutri_s13_rec", group_name="Nutricionista")
        self.paciente = make_paciente("pac_s13_rec")

    def test_recordatorio_guarda_y_recupera_entradas(self):
        """POST con 6 entradas nested, luego GET verifica que persisten"""
        self.client.force_authenticate(user=self.nutri)

        # Crear recordatorio con 6 entradas
        resp_create = self.client.post(
            "/api/recordatorios/",
            {
                "paciente": self.paciente.pk,
                "fecha": "2025-05-27",
                "entradas": [
                    {"nombre": "Desayuno", "descripcion": "Café con leche - 1 taza", "hora": "08:00", "orden": 0},
                    {"nombre": "Desayuno", "descripcion": "Pan integral - 2 rebanadas", "hora": "08:00", "orden": 1},
                    {"nombre": "Almuerzo", "descripcion": "Arroz - 1 taza", "hora": "13:00", "orden": 2},
                    {"nombre": "Almuerzo", "descripcion": "Pollo asado - 150g", "hora": "13:00", "orden": 3},
                    {"nombre": "Cena", "descripcion": "Ensalada - 1 plato", "hora": "19:00", "orden": 4},
                    {"nombre": "Cena", "descripcion": "Pescado - 120g", "hora": "19:00", "orden": 5},
                ],
            },
            format="json",
        )
        self.assertEqual(resp_create.status_code, 201)
        recordatorio_id = resp_create.data["id"]

        # Recuperar y verificar que las 6 entradas están presentes
        resp_get = self.client.get(f"/api/recordatorios/{recordatorio_id}/")
        self.assertEqual(resp_get.status_code, 200)
        self.assertIn("entradas", resp_get.data)
        self.assertEqual(len(resp_get.data["entradas"]), 6)

        # Verificar contenido de una entrada
        entrada_cafe = next(
            (e for e in resp_get.data["entradas"] if "Café con leche" in e["descripcion"]),
            None,
        )
        self.assertIsNotNone(entrada_cafe)
        self.assertEqual(entrada_cafe["nombre"], "Desayuno")
        self.assertEqual(entrada_cafe["descripcion"], "Café con leche - 1 taza")
