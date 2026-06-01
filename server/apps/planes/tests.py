import datetime

from django.contrib.auth.models import Group
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.catalogo.models import GrupoAlimento
from apps.planes.models import PlanAlimenticio, RacionPlan, TiempoComida
from apps.users.models import Paciente
from apps.users.tests import make_paciente, make_user


class TiempoComidaTest(TestCase):
    """TiempoComida se puede crear y listar filtrado por plan"""

    def setUp(self):
        self.client = APIClient()
        Group.objects.get_or_create(name="Nutricionista")
        Group.objects.get_or_create(name="Paciente")
        self.nutri = make_user("nutri_tc", group_name="Nutricionista")
        self.paciente = make_paciente("pac_tc")
        self.plan = PlanAlimenticio.objects.create(
            paciente=self.paciente,
            fecha_inicio=datetime.date(2025, 1, 1),
            activo=True,
            kcal_objetivo=2000,
        )

    def test_crear_tiempo_comida(self):
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.post(
            "/api/tiempos-comida/",
            {
                "plan": self.plan.pk,
                "nombre": "Desayuno",
                "orden": 1,
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["nombre"], "Desayuno")

    def test_listar_tiempos_por_plan(self):
        self.client.force_authenticate(user=self.nutri)
        TiempoComida.objects.create(plan=self.plan, nombre="Desayuno", orden=1)
        TiempoComida.objects.create(plan=self.plan, nombre="Almuerzo", orden=2)
        resp = self.client.get(f"/api/tiempos-comida/?plan={self.plan.pk}")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 2)
        # Deben venir ordenados por orden
        self.assertEqual(resp.data[0]["nombre"], "Desayuno")
        self.assertEqual(resp.data[1]["nombre"], "Almuerzo")

    def test_paciente_no_puede_crear_tiempo_comida(self):
        self.client.force_authenticate(user=self.paciente.user)
        resp = self.client.post(
            "/api/tiempos-comida/",
            {
                "plan": self.plan.pk,
                "nombre": "Cena",
                "orden": 3,
            },
            format="json",
        )
        self.assertIn(resp.status_code, [403, 401])


class RacionPlanTest(TestCase):
    """RacionPlan se puede asignar a un tiempo de comida"""

    def setUp(self):
        self.client = APIClient()
        Group.objects.get_or_create(name="Nutricionista")
        Group.objects.get_or_create(name="Paciente")
        self.nutri = make_user("nutri_rp", group_name="Nutricionista")
        self.paciente = make_paciente("pac_rp")
        self.plan = PlanAlimenticio.objects.create(
            paciente=self.paciente,
            fecha_inicio=datetime.date(2025, 1, 1),
            activo=True,
        )
        self.tiempo = TiempoComida.objects.create(
            plan=self.plan, nombre="Desayuno", orden=1
        )
        self.grupo = GrupoAlimento.objects.create(
            nombre="Frutas test rp",
            kcal_racion=60,
            proteina_g=0,
            carb_g=15,
            grasa_g=0,
        )

    def test_crear_racion(self):
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.post(
            "/api/raciones/",
            {
                "tiempo_comida": self.tiempo.pk,
                "grupo": self.grupo.pk,
                "cantidad": "2.00",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(float(resp.data["cantidad"]), 2.0)
        self.assertEqual(resp.data["grupo_nombre"], "Frutas test rp")
        # kcal_racion del grupo anidado en la ración
        self.assertEqual(float(resp.data["kcal_racion"]), 60.0)

    def test_listar_raciones_por_tiempo_comida(self):
        self.client.force_authenticate(user=self.nutri)
        grupo2 = GrupoAlimento.objects.create(
            nombre="Cereales test rp",
            kcal_racion=80,
            proteina_g=3,
            carb_g=15,
            grasa_g=0,
        )
        RacionPlan.objects.create(
            tiempo_comida=self.tiempo, grupo=self.grupo, cantidad=1
        )
        RacionPlan.objects.create(tiempo_comida=self.tiempo, grupo=grupo2, cantidad=2)
        resp = self.client.get(f"/api/raciones/?tiempo_comida={self.tiempo.pk}")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 2)


class PlanAnidadoTest(TestCase):
    """Plan devuelve tiempos_comida con raciones anidadas"""

    def setUp(self):
        self.client = APIClient()
        Group.objects.get_or_create(name="Nutricionista")
        Group.objects.get_or_create(name="Paciente")
        self.nutri = make_user("nutri_anid", group_name="Nutricionista")
        self.paciente = make_paciente("pac_anid")

    def test_plan_con_tiempos_y_raciones(self):
        plan = PlanAlimenticio.objects.create(
            paciente=self.paciente,
            fecha_inicio=datetime.date(2025, 1, 1),
            activo=True,
            kcal_objetivo=1800,
            pct_proteinas=20,
            pct_grasas=30,
            pct_carbohidratos=50,
        )
        desayuno = TiempoComida.objects.create(plan=plan, nombre="Desayuno", orden=1)
        almuerzo = TiempoComida.objects.create(plan=plan, nombre="Almuerzo", orden=2)
        leche = GrupoAlimento.objects.create(
            nombre="Leche anid", kcal_racion=120, proteina_g=8, carb_g=12, grasa_g=5
        )
        frutas = GrupoAlimento.objects.create(
            nombre="Frutas anid", kcal_racion=60, proteina_g=0, carb_g=15, grasa_g=0
        )
        RacionPlan.objects.create(tiempo_comida=desayuno, grupo=leche, cantidad=1)
        RacionPlan.objects.create(tiempo_comida=almuerzo, grupo=frutas, cantidad=2)

        self.client.force_authenticate(user=self.nutri)
        resp = self.client.get(f"/api/planes/{plan.pk}/")
        self.assertEqual(resp.status_code, 200)

        # Tiempos de comida anidados
        tiempos = resp.data["tiempos_comida"]
        self.assertEqual(len(tiempos), 2)

        # Raciones anidadas en tiempos
        des = next(t for t in tiempos if t["nombre"] == "Desayuno")
        self.assertEqual(len(des["raciones"]), 1)
        self.assertEqual(des["raciones"][0]["grupo_nombre"], "Leche anid")

        # Macros calculados
        self.assertEqual(float(resp.data["proteinas_g"]), 90.0)  # 1800*0.20/4

    def test_plan_activo_paciente_filtrado(self):
        """Paciente solo ve su plan activo"""
        PlanAlimenticio.objects.create(
            paciente=self.paciente,
            fecha_inicio=datetime.date(2025, 1, 1),
            activo=True,
            kcal_objetivo=2000,
        )
        self.client.force_authenticate(user=self.paciente.user)
        resp = self.client.get("/api/planes/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        # tiempos_comida debe estar presente (aunque vacío)
        self.assertIn("tiempos_comida", resp.data[0])


class DuplicarPlanTest(TestCase):
    """Test de duplicación de planes"""

    def setUp(self):
        self.client = APIClient()
        Group.objects.get_or_create(name="Nutricionista")
        Group.objects.get_or_create(name="Paciente")
        self.nutri = make_user("nutri_dup", group_name="Nutricionista")
        self.paciente = make_paciente("pac_dup")

    def test_duplicar_plan_copia_tiempos_y_raciones(self):
        """Duplicar un plan copia todos sus tiempos y raciones, quedando inactivo"""
        # Crear plan original con datos completos
        plan_original = PlanAlimenticio.objects.create(
            paciente=self.paciente,
            fecha_inicio=datetime.date(2025, 1, 1),
            activo=True,
            kcal_objetivo=2000,
            tipo_dieta="normocalorico",
            pct_proteinas=20,
            pct_grasas=30,
            pct_carbohidratos=50,
            notas="Plan original",
        )

        # Crear tiempos de comida
        desayuno = TiempoComida.objects.create(
            plan=plan_original, nombre="Desayuno", orden=1
        )
        almuerzo = TiempoComida.objects.create(
            plan=plan_original, nombre="Almuerzo", orden=2
        )

        # Crear grupos de alimentos
        frutas = GrupoAlimento.objects.create(
            nombre="Frutas dup", kcal_racion=60, proteina_g=0, carb_g=15, grasa_g=0
        )
        cereales = GrupoAlimento.objects.create(
            nombre="Cereales dup", kcal_racion=80, proteina_g=3, carb_g=15, grasa_g=0
        )

        # Crear raciones
        RacionPlan.objects.create(tiempo_comida=desayuno, grupo=frutas, cantidad=2)
        RacionPlan.objects.create(tiempo_comida=almuerzo, grupo=cereales, cantidad=3)

        # Duplicar el plan
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.post(f"/api/planes/{plan_original.pk}/duplicar/")

        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

        # Verificar que el duplicado existe
        plan_duplicado_id = resp.data["id"]
        self.assertNotEqual(plan_duplicado_id, plan_original.pk)

        # Verificar que el duplicado está inactivo
        self.assertFalse(resp.data["activo"])

        # Verificar que tiene los mismos datos
        self.assertEqual(resp.data["kcal_objetivo"], 2000)
        self.assertEqual(resp.data["tipo_dieta"], "normocalorico")

        # Verificar que copió los tiempos de comida
        plan_duplicado = PlanAlimenticio.objects.get(pk=plan_duplicado_id)
        tiempos_duplicados = plan_duplicado.tiempos_comida.all()
        self.assertEqual(tiempos_duplicados.count(), 2)

        # Verificar que copió las raciones
        desayuno_dup = tiempos_duplicados.get(nombre="Desayuno")
        almuerzo_dup = tiempos_duplicados.get(nombre="Almuerzo")
        self.assertEqual(desayuno_dup.raciones.count(), 1)
        self.assertEqual(almuerzo_dup.raciones.count(), 1)

        # Verificar cantidades
        racion_frutas_dup = desayuno_dup.raciones.first()
        self.assertEqual(float(racion_frutas_dup.cantidad), 2.0)
        self.assertEqual(racion_frutas_dup.grupo.nombre, "Frutas dup")


class PlantillasTest(TestCase):
    """Test de plantillas predefinidas"""

    def setUp(self):
        self.client = APIClient()
        Group.objects.get_or_create(name="Nutricionista")
        self.nutri = make_user("nutri_plant", group_name="Nutricionista")

    def test_plantillas_retorna_lista(self):
        """GET /api/planes/plantillas/ retorna 4 plantillas"""
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.get("/api/planes/plantillas/")

        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 4)

        # Verificar estructura de la primera plantilla
        plantilla = resp.data[0]
        self.assertIn("id", plantilla)
        self.assertIn("nombre", plantilla)
        self.assertIn("tipo_dieta", plantilla)
        self.assertIn("kcal_objetivo", plantilla)
        self.assertIn("descripcion", plantilla)
        self.assertIn("tiempos_comida", plantilla)

        # Verificar que cada tiempo de comida tiene los campos necesarios
        tiempo = plantilla["tiempos_comida"][0]
        self.assertIn("nombre", tiempo)
        self.assertIn("hora", tiempo)
        self.assertIn("orden", tiempo)

        # Verificar que las plantillas tienen los datos correctos
        nombres_plantillas = [p["nombre"] for p in resp.data]
        self.assertIn("Pérdida de peso", nombres_plantillas)
        self.assertIn("Mantenimiento", nombres_plantillas)
        self.assertIn("Ganancia muscular", nombres_plantillas)
        self.assertIn("Diabético", nombres_plantillas)


class CalcularRequerimientosTest(TestCase):
    """Test de cálculo de requerimientos nutricionales"""

    def setUp(self):
        self.client = APIClient()
        Group.objects.get_or_create(name="Nutricionista")
        self.nutri = make_user("nutri_calc", group_name="Nutricionista")

    def test_calcular_requerimientos_harris_benedict(self):
        """POST con datos de hombre sedentario, verificar TMB y VCT"""
        self.client.force_authenticate(user=self.nutri)

        # Hombre: 30 años, 70kg, 175cm, sedentario
        resp = self.client.post(
            "/api/calcular-requerimientos/",
            {
                "peso_kg": 70,
                "talla_cm": 175,
                "edad": 30,
                "sexo": "M",
                "nivel_actividad": "sedentario",
            },
            format="json",
        )

        self.assertEqual(resp.status_code, 200)

        # TMB = 10*70 + 6.25*175 - 5*30 + 5 = 700 + 1093.75 - 150 + 5 = 1648.75
        self.assertAlmostEqual(float(resp.data["tmb"]), 1648.8, places=0)

        # VCT = TMB * 1.2 = 1648.75 * 1.2 = 1978.5
        self.assertAlmostEqual(float(resp.data["vct"]), 1978.5, places=0)

        # Verificar que retorna todos los campos
        self.assertIn("kcal_objetivo", resp.data)
        self.assertIn("proteinas_g", resp.data)
        self.assertIn("carbohidratos_g", resp.data)
        self.assertIn("grasas_g", resp.data)

        # Proteínas: 20% de 1978.5 / 4 = 395.7 / 4 = 98.9g
        self.assertAlmostEqual(float(resp.data["proteinas_g"]), 98.9, places=0)

    def test_calcular_requerimientos_mujer(self):
        """Verificar cálculo para mujer"""
        self.client.force_authenticate(user=self.nutri)

        # Mujer: 25 años, 60kg, 165cm, moderado
        resp = self.client.post(
            "/api/calcular-requerimientos/",
            {
                "peso_kg": 60,
                "talla_cm": 165,
                "edad": 25,
                "sexo": "F",
                "nivel_actividad": "moderado",
            },
            format="json",
        )

        self.assertEqual(resp.status_code, 200)

        # TMB = 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25
        self.assertAlmostEqual(float(resp.data["tmb"]), 1345.2, places=0)

        # VCT = TMB * 1.55 = 1345.25 * 1.55 = 2085.1
        self.assertAlmostEqual(float(resp.data["vct"]), 2085.1, places=0)

    def test_calcular_requerimientos_campo_faltante(self):
        """Verificar error cuando falta un campo requerido"""
        self.client.force_authenticate(user=self.nutri)

        resp = self.client.post(
            "/api/calcular-requerimientos/",
            {
                "peso_kg": 70,
                "talla_cm": 175,
                # falta edad, sexo, nivel_actividad
            },
            format="json",
        )

        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", resp.data)


class ReordenarTiemposTest(TestCase):
    """Test de reordenamiento de tiempos de comida"""

    def setUp(self):
        self.client = APIClient()
        Group.objects.get_or_create(name="Nutricionista")
        self.nutri = make_user("nutri_reord", group_name="Nutricionista")
        self.paciente = make_paciente("pac_reord")
        self.plan = PlanAlimenticio.objects.create(
            paciente=self.paciente,
            fecha_inicio=datetime.date(2025, 1, 1),
            activo=True,
        )

    def test_reordenar_tiempos_comida(self):
        """Crear 3 tiempos, reordenar, verificar nuevo orden"""
        # Crear tiempos de comida
        t1 = TiempoComida.objects.create(plan=self.plan, nombre="Desayuno", orden=1)
        t2 = TiempoComida.objects.create(plan=self.plan, nombre="Almuerzo", orden=2)
        t3 = TiempoComida.objects.create(plan=self.plan, nombre="Cena", orden=3)

        self.client.force_authenticate(user=self.nutri)

        # Reordenar: invertir el orden
        resp = self.client.post(
            "/api/tiempos-comida/reordenar/",
            [
                {"id": t3.pk, "orden": 1},
                {"id": t2.pk, "orden": 2},
                {"id": t1.pk, "orden": 3},
            ],
            format="json",
        )

        self.assertEqual(resp.status_code, 200)

        # Verificar que vienen ordenados correctamente
        self.assertEqual(len(resp.data), 3)
        self.assertEqual(resp.data[0]["nombre"], "Cena")
        self.assertEqual(resp.data[0]["orden"], 1)
        self.assertEqual(resp.data[1]["nombre"], "Almuerzo")
        self.assertEqual(resp.data[1]["orden"], 2)
        self.assertEqual(resp.data[2]["nombre"], "Desayuno")
        self.assertEqual(resp.data[2]["orden"], 3)

        # Verificar en la BD
        t1.refresh_from_db()
        t2.refresh_from_db()
        t3.refresh_from_db()
        self.assertEqual(t1.orden, 3)
        self.assertEqual(t2.orden, 2)
        self.assertEqual(t3.orden, 1)
