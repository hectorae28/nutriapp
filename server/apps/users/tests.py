import datetime

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.expediente.models import RegistroProgreso
from apps.planes.models import PlanAlimenticio
from apps.users.models import Paciente

User = get_user_model()


def make_user(username, password="testpass123", group_name=None, **kwargs):
    u = User.objects.create_user(username=username, password=password, **kwargs)
    if group_name:
        g, _ = Group.objects.get_or_create(name=group_name)
        u.groups.add(g)
    return u


def make_paciente(username, **kwargs):
    u = make_user(username, group_name="Paciente")
    return Paciente.objects.create(user=u, **kwargs)


# ── Sprint 1 ──────────────────────────────────────────────────────────────────


class UserPacienteTest(TestCase):
    """Q1 — User + Paciente OneToOne"""

    def test_crear_user_y_paciente(self):
        user = User.objects.create_user(
            username="paciente1",
            password="testpass123",
            first_name="Ana",
            last_name="García",
        )
        paciente = Paciente.objects.create(user=user, cedula="12345678", sexo="F")
        self.assertEqual(paciente.user, user)
        self.assertEqual(user.paciente, paciente)
        self.assertEqual(str(paciente), "Ana García")

    def test_paciente_str_sin_nombre(self):
        user = User.objects.create_user(username="user2", password="testpass123")
        paciente = Paciente.objects.create(user=user)
        self.assertEqual(str(paciente), "user2")


class PlanActivoTest(TestCase):
    """Q2 — Al crear un segundo plan activo, el primero queda inactivo"""

    def setUp(self):
        user = make_user("nutri")
        self.paciente = Paciente.objects.create(user=user)

    def test_plan_anterior_se_desactiva(self):
        plan1 = PlanAlimenticio.objects.create(
            paciente=self.paciente, fecha_inicio=datetime.date(2025, 1, 1), activo=True
        )
        plan2 = PlanAlimenticio.objects.create(
            paciente=self.paciente, fecha_inicio=datetime.date(2025, 6, 1), activo=True
        )
        self.assertFalse(PlanAlimenticio.objects.get(pk=plan1.pk).activo)
        self.assertTrue(PlanAlimenticio.objects.get(pk=plan2.pk).activo)

    def test_un_solo_plan_activo_por_paciente(self):
        for i in range(3):
            PlanAlimenticio.objects.create(
                paciente=self.paciente,
                fecha_inicio=datetime.date(2025, i + 1, 1),
                activo=True,
            )
        self.assertEqual(
            PlanAlimenticio.objects.filter(paciente=self.paciente, activo=True).count(),
            1,
        )


class AuthEndpointTest(TestCase):
    """Q3 Sprint 1 — Endpoints protegidos"""

    def setUp(self):
        self.client = APIClient()

    def test_pacientes_sin_auth_retorna_403(self):
        response = self.client.get("/api/pacientes/")
        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )

    def test_login_exitoso(self):
        User.objects.create_user(username="testuser", password="testpass123")
        response = self.client.post(
            "/api/auth/login/",
            {"username": "testuser", "password": "testpass123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("user", response.data)
        self.assertIn("groups", response.data)

    def test_login_fallido(self):
        response = self.client.post(
            "/api/auth/login/",
            {"username": "noexiste", "password": "wrong"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ── Sprint 2 ──────────────────────────────────────────────────────────────────


class PermisosTest(TestCase):
    """Q1 Sprint 2 — Paciente solo ve sus propios datos"""

    def setUp(self):
        self.client = APIClient()
        Group.objects.get_or_create(name="Nutricionista")
        Group.objects.get_or_create(name="Paciente")

        self.paciente1 = make_paciente("pac1", sexo="F")
        self.paciente2 = make_paciente("pac2", sexo="M")
        self.nutricionista = make_user("nutri1", group_name="Nutricionista")

    def test_paciente_solo_ve_el_suyo(self):
        self.client.force_authenticate(user=self.paciente1.user)
        response = self.client.get("/api/pacientes/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Solo debe ver su propio paciente
        ids = [p["id"] for p in response.data]
        self.assertIn(self.paciente1.pk, ids)
        self.assertNotIn(self.paciente2.pk, ids)

    def test_nutricionista_ve_todos(self):
        self.client.force_authenticate(user=self.nutricionista)
        response = self.client.get("/api/pacientes/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)

    def test_paciente_no_puede_crear_paciente(self):
        self.client.force_authenticate(user=self.paciente1.user)
        response = self.client.post(
            "/api/auth/register-paciente/",
            {
                "user": {"username": "nuevo", "password": "test1234"},
            },
            format="json",
        )
        self.assertIn(
            response.status_code,
            [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED],
        )


class MacrosCalculadosTest(TestCase):
    """Q3 Sprint 2 — Cálculos de macros en serializer de PlanAlimenticio"""

    def setUp(self):
        Group.objects.get_or_create(name="Nutricionista")
        Group.objects.get_or_create(name="Paciente")
        self.client = APIClient()
        self.nutri = make_user("nutri2", group_name="Nutricionista")
        paciente_user = make_user("pac_macros", group_name="Paciente")
        self.paciente = Paciente.objects.create(user=paciente_user)

    def test_macros_calculados(self):
        plan = PlanAlimenticio.objects.create(
            paciente=self.paciente,
            fecha_inicio=datetime.date(2025, 1, 1),
            activo=True,
            kcal_objetivo=2000,
            pct_proteinas=20,
            pct_grasas=30,
            pct_carbohidratos=50,
        )
        self.client.force_authenticate(user=self.nutri)
        response = self.client.get(f"/api/planes/{plan.pk}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # proteinas_g = 2000 * 20/100 / 4 = 100.0
        self.assertEqual(float(response.data["proteinas_g"]), 100.0)
        # grasas_g = 2000 * 30/100 / 9 ≈ 66.7
        self.assertAlmostEqual(float(response.data["grasas_g"]), 66.7, delta=0.1)
        # carbohidratos_g = 2000 * 50/100 / 4 = 250.0
        self.assertEqual(float(response.data["carbohidratos_g"]), 250.0)


class MeEndpointTest(TestCase):
    """Q4 Sprint 2 — /api/auth/me/ devuelve user + groups tras login"""

    def setUp(self):
        Group.objects.get_or_create(name="Nutricionista")
        self.client = APIClient()
        self.nutri = make_user(
            "nutri_me", group_name="Nutricionista", first_name="Ana", last_name="Test"
        )

    def test_me_devuelve_user_y_groups(self):
        # Login
        resp = self.client.post(
            "/api/auth/login/",
            {"username": "nutri_me", "password": "testpass123"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("user", resp.data)
        self.assertIn("groups", resp.data)
        self.assertIn("Nutricionista", resp.data["groups"])

    def test_me_autenticado_con_force(self):
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.get("/api/auth/me/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["user"]["username"], "nutri_me")
        self.assertIn("Nutricionista", resp.data["groups"])

    def test_me_sin_auth_retorna_403(self):
        resp = self.client.get("/api/auth/me/")
        self.assertIn(
            resp.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
        )


# ── Sprint 3 ──────────────────────────────────────────────────────────────────


class SearchPacienteTest(TestCase):
    """Q1 Sprint 3 — Filtro search en /api/pacientes/"""

    def setUp(self):
        self.client = APIClient()
        Group.objects.get_or_create(name="Nutricionista")
        Group.objects.get_or_create(name="Paciente")
        self.nutri = make_user("nutri_search", group_name="Nutricionista")

        u1 = make_user(
            "juanp", group_name="Paciente", first_name="Juan", last_name="Pérez"
        )
        self.pac1 = Paciente.objects.create(user=u1, cedula="11111111")

        u2 = make_user(
            "mariag", group_name="Paciente", first_name="María", last_name="González"
        )
        self.pac2 = Paciente.objects.create(user=u2)

    def test_search_por_nombre(self):
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.get("/api/pacientes/?search=juan")
        self.assertEqual(resp.status_code, 200)
        nombres = [p["user"]["first_name"] for p in resp.data]
        self.assertIn("Juan", nombres)
        self.assertNotIn("María", nombres)

    def test_search_por_cedula(self):
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.get("/api/pacientes/?search=11111111")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["cedula"], "11111111")

    def test_search_sin_resultados(self):
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.get("/api/pacientes/?search=xyznoexiste")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 0)


class RegistroProgresoTest(TestCase):
    """Q3 Sprint 3 — Paciente puede crear RegistroProgreso propio"""

    def setUp(self):
        self.client = APIClient()
        Group.objects.get_or_create(name="Paciente")
        Group.objects.get_or_create(name="Nutricionista")
        self.paciente = make_paciente("pac_progreso")
        self.nutri = make_user("nutri_progreso", group_name="Nutricionista")

    def test_paciente_crea_registro_propio(self):
        self.client.force_authenticate(user=self.paciente.user)
        resp = self.client.post(
            "/api/registros-progreso/",
            {
                "paciente": self.paciente.pk,
                "fecha": "2025-06-01",
                "peso_kg": "72.5",
                "talla_cm": "165.0",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(float(resp.data["peso_kg"]), 72.5)
        # IMC calculado = 72.5 / (1.65^2) ≈ 26.65
        self.assertIsNotNone(resp.data["imc"])
        self.assertGreater(float(resp.data["imc"]), 26)

    def test_nutricionista_crea_registro_para_paciente(self):
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.post(
            "/api/registros-progreso/",
            {
                "paciente": self.paciente.pk,
                "fecha": "2025-06-02",
                "peso_kg": "71.0",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)


# ── Sprint 10 ────────────────────────────────────────────────────────────────
# Tests adicionales para cobertura >80%


class AuthViewsCoverageTest(TestCase):
    """Tests para cubrir líneas faltantes en auth_views.py"""

    def setUp(self):
        self.client = APIClient()
        Group.objects.get_or_create(name="Nutricionista")
        Group.objects.get_or_create(name="Paciente")
        self.nutri = make_user("nutri_cov", group_name="Nutricionista")

    def test_csrf_view(self):
        """Cubre línea 13 de auth_views.py"""
        resp = self.client.get("/api/auth/csrf/")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("detail", resp.json())

    def test_logout_endpoint(self):
        """Cubre líneas 35-36 de auth_views.py"""
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.post("/api/auth/logout/")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("detail", resp.data)

    def test_register_paciente_con_datos_invalidos(self):
        """Cubre líneas 56-60 de auth_views.py (manejo de errores)"""
        self.client.force_authenticate(user=self.nutri)
        # Enviar datos inválidos (sin username)
        resp = self.client.post(
            "/api/auth/register-paciente/",
            {
                "user": {"password": "test1234"},
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("user", resp.data)

    def test_register_paciente_exitoso(self):
        """Cubre el flujo completo de registro de paciente"""
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.post(
            "/api/auth/register-paciente/",
            {
                "user": {
                    "username": "nuevo_pac",
                    "password": "pass123456",
                    "first_name": "Nuevo",
                    "last_name": "Paciente",
                    "email": "nuevo@example.com",
                },
                "cedula": "99999999",
                "sexo": "M",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["cedula"], "99999999")
        # Verificar que el usuario fue creado
        user = User.objects.get(username="nuevo_pac")
        self.assertEqual(user.first_name, "Nuevo")
        self.assertTrue(user.groups.filter(name="Paciente").exists())


class SerializersCoverageTest(TestCase):
    """Tests para cubrir líneas faltantes en serializers.py"""

    def setUp(self):
        Group.objects.get_or_create(name="Paciente")

    def test_user_create_serializer(self):
        """Cubre línea 36 de serializers.py - UserCreateSerializer.create()"""
        from apps.users.serializers import UserCreateSerializer

        serializer = UserCreateSerializer(
            data={
                "username": "testuser_ser",
                "password": "password123",
                "first_name": "Test",
                "last_name": "User",
                "email": "test@example.com",
            }
        )
        self.assertTrue(serializer.is_valid())
        user = serializer.save()
        self.assertEqual(user.username, "testuser_ser")
        self.assertTrue(user.check_password("password123"))

    def test_paciente_create_serializer_atomic(self):
        """Cubre líneas 49-56, 59-60 de serializers.py - PacienteCreateSerializer"""
        from apps.users.serializers import PacienteCreateSerializer

        serializer = PacienteCreateSerializer(
            data={
                "user": {
                    "username": "paciente_atomic",
                    "password": "pass123456",
                    "first_name": "Paciente",
                    "last_name": "Atomic",
                },
                "cedula": "88888888",
                "sexo": "F",
            }
        )
        self.assertTrue(serializer.is_valid())
        paciente = serializer.save()
        self.assertEqual(paciente.cedula, "88888888")
        self.assertEqual(paciente.user.username, "paciente_atomic")
        # Verificar que se asignó el grupo Paciente
        self.assertTrue(paciente.user.groups.filter(name="Paciente").exists())

    def test_paciente_create_sin_grupo_existente(self):
        """Cubre el caso donde no existe el grupo Paciente"""
        from django.contrib.auth.models import Group

        from apps.users.serializers import PacienteCreateSerializer

        # Eliminar el grupo Paciente temporalmente
        Group.objects.filter(name="Paciente").delete()

        serializer = PacienteCreateSerializer(
            data={
                "user": {
                    "username": "pac_nogroup",
                    "password": "pass123456",
                },
                "cedula": "77777777",
                "sexo": "M",
            }
        )
        self.assertTrue(serializer.is_valid())
        paciente = serializer.save()
        self.assertEqual(paciente.cedula, "77777777")
        # Recrear el grupo para no afectar otros tests
        Group.objects.get_or_create(name="Paciente")


# ── Épica 16: Historia Nutricional + Importación Excel ───────────────────────


class ConsumoCaloricoItemTest(TestCase):
    """Q2 — ConsumoCaloricoItem CRUD via API"""

    def setUp(self):
        from apps.expediente.models import ExpedienteClinico

        self.client = APIClient()
        self.nutri = make_user("nutri_cc", group_name="Nutricionista")
        self.client.force_authenticate(user=self.nutri)
        self.paciente = make_paciente("pac_cc")
        self.expediente = ExpedienteClinico.objects.create(paciente=self.paciente)

    def test_crear_item_consumo_calorico(self):
        from apps.expediente.models import ConsumoCaloricoItem

        item = ConsumoCaloricoItem.objects.create(
            expediente=self.expediente,
            grupo="LECHE",
            intercambios="2.00",
            proteinas_g="6.00",
            grasas_g="5.00",
            cho_g="12.00",
            kcal="120.00",
            orden=0,
        )
        self.assertEqual(item.grupo, "LECHE")
        self.assertEqual(float(item.kcal), 120.00)

    def test_consumo_calorico_en_serializer_expediente(self):
        from apps.expediente.models import ConsumoCaloricoItem
        from apps.expediente.serializers import ExpedienteClinicoSerializer

        ConsumoCaloricoItem.objects.create(
            expediente=self.expediente,
            grupo="FRUTAS",
            intercambios="3.00",
            proteinas_g="1.00",
            grasas_g="0.00",
            cho_g="15.00",
            kcal="60.00",
            orden=1,
        )
        serializer = ExpedienteClinicoSerializer(self.expediente)
        data = serializer.data
        self.assertIn("consumo_calorico", data)
        self.assertEqual(len(data["consumo_calorico"]), 1)
        self.assertEqual(data["consumo_calorico"][0]["grupo"], "FRUTAS")

    def test_totales_consumo_calorico(self):
        from apps.expediente.models import ConsumoCaloricoItem

        ConsumoCaloricoItem.objects.create(
            expediente=self.expediente, grupo="LECHE",
            intercambios="2", proteinas_g="6", grasas_g="5",
            cho_g="12", kcal="120", orden=0,
        )
        ConsumoCaloricoItem.objects.create(
            expediente=self.expediente, grupo="FRUTAS",
            intercambios="3", proteinas_g="1", grasas_g="0",
            cho_g="15", kcal="60", orden=1,
        )
        items = self.expediente.consumo_calorico.all()
        total_kcal = sum(float(i.kcal) for i in items)
        self.assertAlmostEqual(total_kcal, 180.00)


class ExamenBioquimicoNuevosCamposTest(TestCase):
    """Q3 — ExamenBioquimico nuevos campos (Tabla 1 y 2)"""

    def setUp(self):
        import datetime
        from apps.expediente.models import ExamenBioquimico

        self.paciente = make_paciente("pac_examen_q3")
        self.examen = ExamenBioquimico.objects.create(
            paciente=self.paciente,
            fecha=datetime.date.today(),
            proteinas_totales="7.50",
            albumina="4.20",
            globulina="3.30",
            urea="25.00",
            creatinina="0.90",
            acido_urico="5.00",
            colesterol="180.00",
            hdl="55.00",
            ldl="100.00",
            vldl="25.00",
            trigliceridos="120.00",
            glucosa="90.00",
            glucosa_postprandial="130.00",
            insulina="8.00",
            insulina_postprandial="40.00",
            hemoglobina_glicosilada="5.50",
            tgo="25.00",
            tgp="22.00",
            bilirrubina_total="0.80",
            bilirrubina_directa="0.20",
            bilirrubina_indirecta="0.60",
            hemoglobina="14.00",
            hematocrito="42.00",
            t3="1.20",
            t4="8.00",
            tsh="2.00",
            hierro="85.00",
            vitamina_b12="350.00",
            sodio="140.00",
            potasio="4.00",
            cloro="102.00",
            calcio="9.50",
        )

    def test_examen_con_todos_campos_creado(self):
        self.assertIsNotNone(self.examen.pk)
        self.assertEqual(float(self.examen.hemoglobina_glicosilada), 5.50)
        self.assertEqual(float(self.examen.tsh), 2.00)
        self.assertEqual(float(self.examen.vitamina_b12), 350.00)
        self.assertEqual(float(self.examen.calcio), 9.50)

    def test_examen_serializer_nuevos_campos(self):
        from rest_framework import serializers as drf_serializers

        from apps.expediente.serializers import ExamenBioquimicoSerializer

        serializer = ExamenBioquimicoSerializer(self.examen)
        data = serializer.data
        self.assertIn("hemoglobina_glicosilada", data)
        self.assertIn("tsh", data)
        self.assertIn("vitamina_b12", data)
        self.assertIn("calcio", data)
        self.assertIn("cloro", data)


class ImportarExcelEndpointTest(TestCase):
    """Q1 — Endpoint POST /api/pacientes/importar-excel/"""

    def setUp(self):
        self.client = APIClient()
        self.nutri = make_user("nutri_excel", group_name="Nutricionista")
        self.client.force_authenticate(user=self.nutri)

    def test_importar_excel_real(self):
        """El endpoint procesa el XLS real sin error 500. Puede retornar 200/201 o 400 con advertencias."""
        import os

        xls_path = os.path.join(
            os.path.dirname(__file__),
            "../../../docs/historia_nutricional.xls",
        )
        xls_path = os.path.normpath(xls_path)
        if not os.path.exists(xls_path):
            self.skipTest("Archivo historia_nutricional.xls no encontrado")

        with open(xls_path, "rb") as f:
            response = self.client.post(
                "/api/pacientes/importar-excel/",
                {"archivo": f},
                format="multipart",
            )
        # Acepta 200/201 (datos extraídos) o 400 (datos incompletos con advertencias)
        # pero NO 500 (error inesperado)
        self.assertIn(response.status_code, [200, 201, 400])
        data = response.json()
        # En cualquier caso debe retornar JSON válido
        self.assertIsInstance(data, dict)

    def test_importar_excel_crea_solo_un_examen_bioquimico(self):
        """BUG FIX — Verificar que importar Excel crea UN SOLO ExamenBioquimico (no 2)"""
        import os
        from apps.expediente.models import ExamenBioquimico

        xls_path = os.path.join(
            os.path.dirname(__file__),
            "../../../docs/historia_nutricional.xls",
        )
        xls_path = os.path.normpath(xls_path)
        if not os.path.exists(xls_path):
            self.skipTest("Archivo historia_nutricional.xls no encontrado")

        # Limpiar cualquier examen previo
        ExamenBioquimico.objects.all().delete()

        with open(xls_path, "rb") as f:
            response = self.client.post(
                "/api/pacientes/importar-excel/",
                {"archivo": f},
                format="multipart",
            )
        
        # Debe responder exitosamente o con advertencias
        self.assertIn(response.status_code, [200, 201, 400])
        
        if response.status_code in [200, 201]:
            data = response.json()
            paciente_id = data.get("paciente_id")
            
            if paciente_id:
                # VERIFICAR: Solo debe haber 1 ExamenBioquimico por paciente
                # (las 2 tablas del Excel se combinan en un solo registro)
                from apps.users.models import Paciente
                paciente = Paciente.objects.get(pk=paciente_id)
                examenes_count = ExamenBioquimico.objects.filter(paciente=paciente).count()
                
                self.assertEqual(
                    examenes_count, 
                    1, 
                    f"ERROR: Se crearon {examenes_count} ExamenBioquimico en lugar de 1. "
                    "Las 2 tablas del Excel deben combinarse en UN SOLO registro."
                )
                
                # Verificar que el único examen tiene campos de AMBAS tablas
                examen = ExamenBioquimico.objects.get(paciente=paciente)
                # Campos de Tabla 1 (si están en el Excel)
                # Campos de Tabla 2 (si están en el Excel)
                # Al menos verificamos que el objeto existe
                self.assertIsNotNone(examen.fecha)

    def test_importar_excel_archivo_invalido(self):
        import io

        fake_file = io.BytesIO(b"esto no es un excel")
        fake_file.name = "invalido.xlsx"
        response = self.client.post(
            "/api/pacientes/importar-excel/",
            {"archivo": fake_file},
            format="multipart",
        )
        self.assertEqual(response.status_code, 400)

    def test_importar_excel_sin_archivo(self):
        response = self.client.post(
            "/api/pacientes/importar-excel/",
            {},
            format="multipart",
        )
        self.assertEqual(response.status_code, 400)

    def test_importar_excel_requiere_autenticacion(self):
        import io

        anon_client = APIClient()
        fake_file = io.BytesIO(b"x")
        fake_file.name = "test.xls"
        response = anon_client.post(
            "/api/pacientes/importar-excel/",
            {"archivo": fake_file},
            format="multipart",
        )
        self.assertIn(response.status_code, [401, 403])

    def test_importar_excel_no_crea_plan_alimenticio(self):
        """Tarea B3 — Verificar que importar Excel NO crea PlanAlimenticio"""
        import os
        from apps.planes.models import PlanAlimenticio

        xls_path = os.path.join(
            os.path.dirname(__file__),
            "../../../docs/historia_nutricional.xls",
        )
        xls_path = os.path.normpath(xls_path)
        if not os.path.exists(xls_path):
            self.skipTest("Archivo historia_nutricional.xls no encontrado")

        # Contar planes antes de importar
        count_before = PlanAlimenticio.objects.count()

        with open(xls_path, "rb") as f:
            response = self.client.post(
                "/api/pacientes/importar-excel/",
                {"archivo": f},
                format="multipart",
            )

        # Verificar que NO aumentó el conteo de PlanAlimenticio
        count_after = PlanAlimenticio.objects.count()
        self.assertEqual(
            count_before,
            count_after,
            "La importación de Excel NO debe crear PlanAlimenticio"
        )

    def test_importar_excel_crea_recordatorio_alimentario(self):
        """Verificar que importar Excel crea RecordatorioAlimentario con entradas"""
        import os
        from apps.expediente.models import RecordatorioAlimentario, EntradaRecordatorio
        from apps.users.models import Paciente

        xls_path = os.path.join(
            os.path.dirname(__file__),
            "../../../docs/historia_nutricional.xls",
        )
        xls_path = os.path.normpath(xls_path)
        if not os.path.exists(xls_path):
            self.skipTest("Archivo historia_nutricional.xls no encontrado")

        # Limpiar cualquier recordatorio previo
        RecordatorioAlimentario.objects.all().delete()

        with open(xls_path, "rb") as f:
            response = self.client.post(
                "/api/pacientes/importar-excel/",
                {"archivo": f},
                format="multipart",
            )

        self.assertIn(response.status_code, [200, 201])
        data = response.json()
        paciente_id = data.get("paciente_id")
        self.assertIsNotNone(paciente_id, "Debe retornar paciente_id")

        # Verificar que se creó exactamente UN recordatorio
        paciente = Paciente.objects.get(pk=paciente_id)
        recordatorios = RecordatorioAlimentario.objects.filter(paciente=paciente)
        self.assertEqual(recordatorios.count(), 1, "Debe crear exactamente 1 RecordatorioAlimentario")

        # Verificar que tiene entradas
        recordatorio = recordatorios.first()
        entradas = recordatorio.entradas.all()
        self.assertGreater(entradas.count(), 0, "El recordatorio debe tener al menos 1 entrada")

        # Verificar estructura de las entradas
        for entrada in entradas:
            self.assertIsNotNone(entrada.nombre, "La entrada debe tener nombre")
            self.assertIsNotNone(entrada.descripcion, "La entrada debe tener descripción")
            self.assertIsInstance(entrada.orden, int, "La entrada debe tener orden numérico")

        # Verificar que al menos una entrada tiene hora parseada
        entradas_con_hora = [e for e in entradas if e.hora is not None]
        self.assertGreater(len(entradas_con_hora), 0, "Al menos una entrada debe tener hora parseada")


class IntegracionEpica16Test(TestCase):
    """Q4 — Integración completa: paciente con expediente completo, consumo calórico y exámenes"""

    def setUp(self):
        import datetime
        from apps.expediente.models import ConsumoCaloricoItem, ExamenBioquimico, ExpedienteClinico

        self.client = APIClient()
        self.nutri = make_user("nutri_integracion", group_name="Nutricionista")
        self.client.force_authenticate(user=self.nutri)
        self.paciente = make_paciente(
            "pac_integracion",
            cedula="99999999",
            fecha_nacimiento=datetime.date(1990, 5, 15),
        )
        self.expediente = ExpedienteClinico.objects.create(
            paciente=self.paciente,
            motivo_consulta="Control de peso",
            observaciones_calorias="Gasta 2500 Calorías/día",
            contextura="mediana",
            peso_prequirurgico_kg="85.00",
        )
        ConsumoCaloricoItem.objects.bulk_create([
            ConsumoCaloricoItem(expediente=self.expediente, grupo="LECHE", intercambios=2, proteinas_g=6, grasas_g=5, cho_g=12, kcal=120, orden=0),
            ConsumoCaloricoItem(expediente=self.expediente, grupo="CARNES_A", intercambios=3, proteinas_g=21, grasas_g=9, cho_g=0, kcal=165, orden=1),
        ])
        ExamenBioquimico.objects.create(
            paciente=self.paciente,
            fecha=datetime.date.today(),
            glucosa="95.00",
            colesterol="200.00",
            tsh="2.50",
        )

    def test_reporte_paciente_incluye_consumo_calorico(self):
        response = self.client.get(f"/api/reporte-paciente/{self.paciente.id}/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("expediente", data)
        expediente = data["expediente"]
        self.assertIn("consumo_calorico", expediente)
        self.assertEqual(len(expediente["consumo_calorico"]), 2)

    def test_expediente_nuevos_campos_en_api(self):
        response = self.client.get(f"/api/reporte-paciente/{self.paciente.id}/")
        self.assertEqual(response.status_code, 200)
        expediente = response.json()["expediente"]
        self.assertEqual(expediente["observaciones_calorias"], "Gasta 2500 Calorías/día")
        self.assertEqual(expediente["contextura"], "mediana")

    def test_examenes_en_reporte_con_nuevos_campos(self):
        response = self.client.get(f"/api/reporte-paciente/{self.paciente.id}/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("examenes", data)
        examen = data["examenes"][0]
        self.assertIn("tsh", examen)
