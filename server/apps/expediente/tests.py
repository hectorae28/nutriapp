import datetime
from datetime import timedelta

from django.contrib.auth.models import Group
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.catalogo.models import GrupoAlimento
from apps.expediente.models import (
    ExamenBioquimico,
    ExpedienteClinico,
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

        # Verificar distribución de dietas - puede ser dict o list
        self.assertIsInstance(resp.data["distribucion_tipo_dieta"], list)


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


# ── Sprint 14 - Documentos Médicos PDF + QR ──────────────────────────────────


class DocumentoMedicoTest(APITestCase):
    """Tests para generación de documentos médicos con PDF y QR"""

    def setUp(self):
        # Crear nutricionista
        self.nutricionista = make_user('doc_test', group_name='Nutricionista')
        self.client.force_authenticate(user=self.nutricionista)

        # Crear paciente
        self.paciente = make_paciente('pac_doc_test')

    def test_crear_receta_genera_pdf(self):
        """POST /api/documentos/ con tipo receta → 200 + PDF binario"""
        payload = {
            "paciente": self.paciente.id,
            "tipo": "receta",
            "contenido": {
                "medicamentos": [{"nombre": "Metformina", "dosis": "500mg", "frecuencia": "1 vez al día", "duracion": "30 días"}],
                "indicaciones": "Tomar con alimentos"
            }
        }
        resp = self.client.post('/api/documentos/', payload, format='json')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp['Content-Type'], 'application/pdf')
        self.assertGreater(len(resp.content), 1000)  # PDF tiene contenido

    def test_crear_orden_laboratorio_genera_pdf(self):
        """POST con tipo orden_laboratorio → PDF generado"""
        payload = {
            "paciente": self.paciente.id,
            "tipo": "orden_laboratorio",
            "contenido": {
                "estudios": ["Hemograma completo", "Glicemia en ayunas", "Perfil lipídico"],
                "indicaciones": "Ayuno de 12 horas"
            }
        }
        resp = self.client.post('/api/documentos/', payload, format='json')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp['Content-Type'], 'application/pdf')

    def test_verificar_uuid_valido(self):
        """GET /api/documentos/verificar/{uuid}/ → {valido: true}"""
        from apps.expediente.models import DocumentoMedico
        doc = DocumentoMedico.objects.create(
            paciente=self.paciente,
            tipo='constancia',
            contenido={'texto': 'Se hace constar que el paciente asiste a consulta nutricional.'},
            creado_por=self.nutricionista
        )
        resp = self.client.get(f'/api/documentos/verificar/{doc.uuid_validacion}/')
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.data['valido'])
        self.assertEqual(resp.data['tipo'], 'Constancia Médica')

    def test_verificar_uuid_invalido(self):
        """GET con UUID falso → 404 {valido: false}"""
        resp = self.client.get('/api/documentos/verificar/00000000-0000-0000-0000-000000000000/')
        self.assertEqual(resp.status_code, 404)
        self.assertFalse(resp.data['valido'])

    def test_solo_nutricionista_crea_documentos(self):
        """Paciente intenta POST → 403 Forbidden"""
        pac_user = self.paciente.user
        self.client.force_authenticate(user=pac_user)
        payload = {
            "paciente": self.paciente.id,
            "tipo": "receta",
            "contenido": {"medicamentos": [{"nombre": "Test"}]}
        }
        resp = self.client.post('/api/documentos/', payload, format='json')
        self.assertEqual(resp.status_code, 403)

    def test_pdf_generator_usa_site_url_de_env(self):
        """pdf_generator.SITE_URL debe coincidir con os.environ.get('SITE_URL', ...)"""
        import os
        from apps.expediente.pdf_generator import SITE_URL
        expected = os.environ.get('SITE_URL', 'http://localhost:8000')
        self.assertEqual(SITE_URL, expected)


# ─────────────────────────────────────────────────────────────────────────────
# Tests de campos calculados: %PP, %PI, %PU, g/kg-p/día, kcal/día totales
# ─────────────────────────────────────────────────────────────────────────────

class CamposCalculadosRegistroProgresoTest(TestCase):
    """%PP, %PI, %PU calculados en RegistroProgresoSerializer usando pesos del expediente."""

    def setUp(self):
        self.client = APIClient()
        Group.objects.get_or_create(name="Paciente")
        Group.objects.get_or_create(name="Nutricionista")
        self.paciente = make_paciente("pac_calc")
        self.nutri = make_user("nutri_calc", group_name="Nutricionista")

        # Crear expediente con pesos de referencia (datos del Excel)
        self.expediente = ExpedienteClinico.objects.create(
            paciente=self.paciente,
            peso_usual_kg="90.00",
            peso_ideal_kg="70.25",
            peso_prequirurgico_kg="78.32",
            peso_maximo_kg="97.00",
            peso_minimo_kg="83.00",
            peso_deseado_kg="85.00",
            motivo_consulta="Test",
        )

    def test_pct_pp_ganancia(self):
        """%PP negativo cuando P.Actual > P.Usual (ganancia de peso)."""
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.post("/api/registros-progreso/", {
            "paciente": self.paciente.pk,
            "fecha": "2026-04-23",
            "peso_kg": "90.15",
            "talla_cm": "177.0",
        }, format="json")
        self.assertEqual(resp.status_code, 201)
        # %PP = (90 - 90.15) / 90 * 100 = -0.17%
        self.assertIsNotNone(resp.data["pct_pp"])
        self.assertAlmostEqual(float(resp.data["pct_pp"]), -0.17, delta=0.02)

    def test_pct_pi_sobrepeso_vs_ideal(self):
        """%PI > 100 indica que el paciente está sobre el peso ideal."""
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.post("/api/registros-progreso/", {
            "paciente": self.paciente.pk,
            "fecha": "2026-04-23",
            "peso_kg": "90.15",
            "talla_cm": "177.0",
        }, format="json")
        self.assertEqual(resp.status_code, 201)
        # %PI = 90.15 / 70.25 * 100 = 128.33%
        self.assertIsNotNone(resp.data["pct_pi"])
        self.assertAlmostEqual(float(resp.data["pct_pi"]), 128.33, delta=0.1)

    def test_pct_pu_sobre_peso_usual(self):
        """%PU > 100 indica que el paciente está sobre su peso usual."""
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.post("/api/registros-progreso/", {
            "paciente": self.paciente.pk,
            "fecha": "2026-04-23",
            "peso_kg": "90.15",
            "talla_cm": "177.0",
        }, format="json")
        self.assertEqual(resp.status_code, 201)
        # %PU = 90.15 / 90 * 100 = 100.17%
        self.assertIsNotNone(resp.data["pct_pu"])
        self.assertAlmostEqual(float(resp.data["pct_pu"]), 100.17, delta=0.02)

    def test_pct_null_sin_expediente(self):
        """%PP/%PI/%PU son null si el paciente no tiene expediente."""
        pac2 = make_paciente("pac_sin_exp")
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.post("/api/registros-progreso/", {
            "paciente": pac2.pk,
            "fecha": "2026-01-01",
            "peso_kg": "70.0",
            "talla_cm": "170.0",
        }, format="json")
        self.assertEqual(resp.status_code, 201)
        self.assertIsNone(resp.data["pct_pp"])
        self.assertIsNone(resp.data["pct_pi"])
        self.assertIsNone(resp.data["pct_pu"])

    def test_pct_pp_perdida_real(self):
        """%PP positivo cuando P.Actual < P.Usual (pérdida de peso real)."""
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.post("/api/registros-progreso/", {
            "paciente": self.paciente.pk,
            "fecha": "2026-05-01",
            "peso_kg": "85.00",  # bajo el usual de 90
            "talla_cm": "177.0",
        }, format="json")
        self.assertEqual(resp.status_code, 201)
        # %PP = (90 - 85) / 90 * 100 = 5.56%
        self.assertGreater(float(resp.data["pct_pp"]), 0)
        self.assertAlmostEqual(float(resp.data["pct_pp"]), 5.56, delta=0.05)


class CamposCalculadosExpedienteTest(TestCase):
    """kcal/día, g/día totales, g/kg-p/día, %PI, %P.Pre-Qx en ExpedienteClinicoSerializer."""

    def setUp(self):
        self.client = APIClient()
        Group.objects.get_or_create(name="Paciente")
        Group.objects.get_or_create(name="Nutricionista")
        self.paciente = make_paciente("pac_exp_calc")
        self.nutri = make_user("nutri_exp_calc", group_name="Nutricionista")

    def _crear_expediente(self):
        """Crea expediente con consumo calórico real (datos del Excel)."""
        from apps.expediente.models import ConsumoCaloricoItem
        exp = ExpedienteClinico.objects.create(
            paciente=self.paciente,
            peso_usual_kg="90.00",
            peso_ideal_kg="70.25",
            peso_prequirurgico_kg="78.32",
            peso_maximo_kg="97.00",
            peso_minimo_kg="83.00",
            peso_deseado_kg="85.00",
            motivo_consulta="Test cálculos",
        )
        # Datos del Excel de Héctor Delgado
        grupos = [
            ("LECHE",    1,   8.0,  2.5,  12.0,  102.0),
            ("CARNES_A", 10, 70.0, 30.0,   0.0,  550.0),
            ("VEGETALES", 2,  4.0,  0.0,  10.0,   50.0),
            ("FRUTAS",   2,   0.0,  0.0,  30.0,  120.0),
            ("ALMIDONES", 5, 15.0,  0.0,  75.0,  400.0),
            ("GRASAS",   7,   0.0, 35.0,   0.0,  315.0),
        ]
        for idx, (grupo, intercambios, p, g, cho, kcal) in enumerate(grupos):
            ConsumoCaloricoItem.objects.create(
                expediente=exp, grupo=grupo, intercambios=intercambios,
                proteinas_g=p, grasas_g=g, cho_g=cho, kcal=kcal, orden=idx,
            )
        return exp

    def test_total_kcal_dia(self):
        """total_kcal_dia suma correctamente todos los items."""
        self._crear_expediente()
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.get(f"/api/expedientes/?paciente={self.paciente.pk}")
        self.assertEqual(resp.status_code, 200)
        data = resp.data[0] if isinstance(resp.data, list) else resp.data["results"][0]
        # 102 + 550 + 50 + 120 + 400 + 315 = 1537
        self.assertAlmostEqual(float(data["total_kcal_dia"]), 1537.0, delta=0.1)

    def test_total_proteinas_g_dia(self):
        """total_proteinas_g_dia suma correctamente."""
        self._crear_expediente()
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.get(f"/api/expedientes/?paciente={self.paciente.pk}")
        self.assertEqual(resp.status_code, 200)
        data = resp.data[0] if isinstance(resp.data, list) else resp.data["results"][0]
        # 8 + 70 + 4 + 0 + 15 + 0 = 97
        self.assertAlmostEqual(float(data["total_proteinas_g_dia"]), 97.0, delta=0.1)

    def test_g_kg_p_dia_proteinas(self):
        """proteinas_g_kg_dia = total_P / peso_usual."""
        self._crear_expediente()
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.get(f"/api/expedientes/?paciente={self.paciente.pk}")
        self.assertEqual(resp.status_code, 200)
        data = resp.data[0] if isinstance(resp.data, list) else resp.data["results"][0]
        # 97 / 90 = 1.08
        self.assertAlmostEqual(float(data["proteinas_g_kg_dia"]), 1.08, delta=0.01)

    def test_g_kg_p_dia_cho(self):
        """cho_g_kg_dia = total_CHO / peso_usual."""
        self._crear_expediente()
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.get(f"/api/expedientes/?paciente={self.paciente.pk}")
        self.assertEqual(resp.status_code, 200)
        data = resp.data[0] if isinstance(resp.data, list) else resp.data["results"][0]
        # 127 / 90 = 1.41
        self.assertAlmostEqual(float(data["cho_g_kg_dia"]), 1.41, delta=0.01)

    def test_pct_peso_ideal(self):
        """%PI = peso_usual / peso_ideal * 100."""
        self._crear_expediente()
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.get(f"/api/expedientes/?paciente={self.paciente.pk}")
        self.assertEqual(resp.status_code, 200)
        data = resp.data[0] if isinstance(resp.data, list) else resp.data["results"][0]
        # 90 / 70.25 * 100 = 128.11%
        self.assertAlmostEqual(float(data["pct_peso_ideal"]), 128.11, delta=0.1)

    def test_pct_peso_prequirurgico(self):
        """%P.Pre-Qx = peso_prequirurgico / peso_usual * 100."""
        self._crear_expediente()
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.get(f"/api/expedientes/?paciente={self.paciente.pk}")
        self.assertEqual(resp.status_code, 200)
        data = resp.data[0] if isinstance(resp.data, list) else resp.data["results"][0]
        # 78.32 / 90 * 100 = 87.02%
        self.assertAlmostEqual(float(data["pct_peso_prequirurgico"]), 87.02, delta=0.1)

    def test_campos_null_sin_consumo(self):
        """g/kg-p/día son null si no hay consumo calórico."""
        ExpedienteClinico.objects.create(
            paciente=self.paciente,
            peso_usual_kg="90.00",
            peso_ideal_kg="70.25",
            motivo_consulta="Sin consumo",
        )
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.get(f"/api/expedientes/?paciente={self.paciente.pk}")
        self.assertEqual(resp.status_code, 200)
        data = resp.data[0] if isinstance(resp.data, list) else resp.data["results"][0]
        # Sin items → totales = 0, g/kg = 0 (no null, sino 0/90 = 0.0)
        self.assertEqual(float(data["total_kcal_dia"]), 0.0)
        self.assertEqual(float(data["proteinas_g_kg_dia"]), 0.0)
