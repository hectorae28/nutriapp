from django.contrib.auth.models import Group
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.catalogo.models import Alimento, GrupoAlimento
from apps.users.tests import make_user


class CatalogoAPITest(TestCase):
    """Q2 Sprint 3 — Catálogo devuelve grupos con alimentos anidados"""

    def setUp(self):
        self.client = APIClient()
        Group.objects.get_or_create(name="Nutricionista")
        self.nutri = make_user("nutri_cat", group_name="Nutricionista")

        self.grupo = GrupoAlimento.objects.create(
            nombre="Frutas test",
            kcal_racion=60,
            proteina_g=0,
            carb_g=15,
            grasa_g=0,
        )
        Alimento.objects.create(
            grupo=self.grupo, nombre="Manzana", porcion_g=90, unidad="1 unidad"
        )
        Alimento.objects.create(
            grupo=self.grupo, nombre="Pera", porcion_g=90, unidad="1 unidad"
        )

    def test_grupos_con_alimentos_anidados(self):
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.get("/api/grupos-alimento/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # Encontrar el grupo de test
        grupo = next((g for g in resp.data if g["nombre"] == "Frutas test"), None)
        self.assertIsNotNone(grupo)
        self.assertEqual(len(grupo["alimentos"]), 2)
        nombres = [a["nombre"] for a in grupo["alimentos"]]
        self.assertIn("Manzana", nombres)
        self.assertIn("Pera", nombres)

    def test_alimentos_filtrados_por_grupo(self):
        self.client.force_authenticate(user=self.nutri)
        resp = self.client.get(f"/api/alimentos/?grupo={self.grupo.pk}")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 2)

    def test_catalogo_requiere_auth(self):
        resp = self.client.get("/api/grupos-alimento/")
        self.assertIn(
            resp.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
        )
