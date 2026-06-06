"""
Comando de gestión: seed_data
=====================================
Genera datos falsos para desarrollo y pruebas.

Modos
-----
  --base      Solo datos mínimos para que el sistema funcione:
                • Usuario admin
                • Grupos de alimentos + alimentos de catálogo
                • Grupo "Nutricionista" y un usuario nutricionista demo

  --completo  Todo lo anterior más datos ficticios de pacientes:
                • Pacientes (con usuario asociado)
                • Expediente clínico (con consumo calórico y exámenes)
                • Registros de progreso
                • Planes alimenticios (con tiempos de comida y raciones)
                • Recordatorios alimentarios

Flags adicionales
-----------------
  --flush           Borra TODA la data antes de sembrar (pide confirmación)
  --flush-confirm   Igual que --flush pero sin pedir confirmación (CI/CD)
  --pacientes N     Cantidad de pacientes a crear en modo --completo (default: 10)

Ejemplos
--------
  python manage.py seed_data --base
  python manage.py seed_data --completo --pacientes 20
  python manage.py seed_data --flush --base
  python manage.py seed_data --flush-confirm --completo --pacientes 5
"""

import random
from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand, CommandError

from apps.catalogo.models import Alimento, GrupoAlimento
from apps.expediente.models import (
    ConsumoCaloricoItem,
    ExamenBioquimico,
    ExpedienteClinico,
    RecordatorioAlimentario,
    EntradaRecordatorio,
    RegistroProgreso,
)
from apps.planes.models import PlanAlimenticio, RacionPlan, TiempoComida
from apps.users.models import Paciente

User = get_user_model()

# ---------------------------------------------------------------------------
# Catálogo real de grupos y alimentos (espejo de catalogo_inicial.json)
# ---------------------------------------------------------------------------

GRUPOS_BASE = [
    # Fuente: "Listas de Intercambio" — Nuevo Formato Plan de Alimentación 2020
    {"nombre": "Lácteos",        "kcal_racion": "120.00", "proteina_g": "8.00", "carb_g": "12.00", "grasa_g": "5.00"},
    {"nombre": "Vegetales",      "kcal_racion": "25.00",  "proteina_g": "2.00", "carb_g": "5.00",  "grasa_g": "0.00"},
    {"nombre": "Frutas",         "kcal_racion": "60.00",  "proteina_g": "0.00", "carb_g": "15.00", "grasa_g": "0.00"},
    {"nombre": "Acompañantes",   "kcal_racion": "80.00",  "proteina_g": "3.00", "carb_g": "15.00", "grasa_g": "0.00"},
    {"nombre": "Proteínas",      "kcal_racion": "55.00",  "proteina_g": "7.00", "carb_g": "0.00",  "grasa_g": "3.00"},
    {"nombre": "Grasas",         "kcal_racion": "45.00",  "proteina_g": "0.00", "carb_g": "0.00",  "grasa_g": "5.00"},
]

# Tupla: (nombre, porcion_g, unidad)
# porcion_g = gramos o ml explícitos del XLS; 0 = sin peso indicado en la fuente
ALIMENTOS_BASE = {
    # -------------------------------------------------------------------------
    # LÁCTEOS
    # -------------------------------------------------------------------------
    "Lácteos": [
        # Leche de origen animal
        ("Leche líquida completa",                           "240.00", "1 Taza"),
        ("Leche líquida descremada",                         "240.00", "1 Taza"),
        ("Leche líquida deslactosada",                       "240.00", "1 Taza"),
        ("Leche líquida deslactosada semidescremada",        "240.00", "1 Taza"),
        ("Leche líquida de cabra",                           "240.00", "1 Taza"),
        ("Leche en polvo completa",                          "25.00",  "4 Cucharadas"),
        ("Leche en polvo descremada",                        "25.00",  "4 Cucharadas"),
        ("Leche en polvo deslactosada",                      "25.00",  "4 Cucharadas"),
        ("Leche en polvo deslactosada semidescremada",       "25.00",  "4 Cucharadas"),
        # Yogur de origen animal
        ("Yogur entero",                                     "240.00", "1 Taza"),
        ("Yogur descremado",                                 "240.00", "1 Taza"),
        # Leche de origen vegetal
        ("Leche vegetal (almendras, avellanas, nueces, maní)", "240.00", "1 Taza"),
        ("Leche líquida de coco",                            "240.00", "1 Taza"),
        ("Leche líquida de soya",                            "240.00", "1 Taza"),
        # Yogur de origen vegetal
        ("Yogur de almendras",                               "240.00", "1 Taza"),
        ("Yogur de coco",                                    "240.00", "1 Taza"),
    ],

    # -------------------------------------------------------------------------
    # VEGETALES  (1 a 2 Tazas solos o combinados entre sí por ración)
    # -------------------------------------------------------------------------
    "Vegetales": [
        ("Acelgas",                                          "100.00", "1 a 2 Tazas"),
        ("Ají",                                              "100.00", "1 a 2 Tazas"),
        ("Ajoporro | Puerro",                                "100.00", "1 a 2 Tazas"),
        ("Alcachofa",                                        "100.00", "1 a 2 Tazas"),
        ("Alfalfa",                                          "100.00", "1 a 2 Tazas"),
        ("Apio España | Célery",                             "100.00", "1 a 2 Tazas"),
        ("Auyama",                                           "100.00", "1/2 Taza"),
        ("Berenjena",                                        "100.00", "1 a 2 Tazas"),
        ("Berro",                                            "100.00", "1 a 2 Tazas"),
        ("Calabacín | Zuquini",                              "100.00", "1 a 2 Tazas"),
        ("Cebolla",                                          "100.00", "1 a 2 Tazas"),
        ("Cebollín | Cebolla larga",                         "100.00", "1 a 2 Tazas"),
        ("Champiñón",                                        "100.00", "1 a 2 Tazas"),
        ("Chayota | Guatila",                                "100.00", "1 a 2 Tazas"),
        ("Coliflor, Brócoli, Repollo, Radiquio, Repollitos","100.00", "1 a 2 Tazas"),
        ("Escarola",                                         "100.00", "1 a 2 Tazas"),
        ("Espárrago",                                        "100.00", "1 a 2 Tazas"),
        ("Espinaca",                                         "100.00", "1 a 2 Tazas"),
        ("Guisante (Petit-Pois)",                            "100.00", "1 a 2 Tazas"),
        ("Hongos",                                           "100.00", "1 a 2 Tazas"),
        ("Lechuga",                                          "100.00", "1 a 2 Tazas"),
        ("Nabo",                                             "100.00", "1 a 2 Tazas"),
        ("Palmito",                                          "100.00", "1 a 2 Tazas"),
        ("Pepino",                                           "100.00", "1 a 2 Tazas"),
        ("Perejil, cilantro, hierbabuena",                   "100.00", "1 a 2 Tazas"),
        ("Pimentón",                                         "100.00", "1 a 2 Tazas"),
        ("Rábano",                                           "100.00", "1 a 2 Tazas"),
        ("Remolacha",                                        "100.00", "1 a 2 Tazas"),
        ("Rúgula | Rúcula",                                  "100.00", "1 a 2 Tazas"),
        ("Tomate",                                           "100.00", "1 a 2 Tazas"),
        ("Tomate cherry",                                    "100.00", "1 a 2 Tazas"),
        ("Vainitas | Habichuelas",                           "100.00", "1 a 2 Tazas"),
        ("Zanahoria",                                        "100.00", "1 a 2 Tazas"),
    ],

    # -------------------------------------------------------------------------
    # FRUTAS
    # -------------------------------------------------------------------------
    "Frutas": [
        ("Albaricoque",                 "100.00", "1 Und. Med."),
        ("Arándanos | Blueberry",       "100.00", "1 Taza"),
        ("Cambur | Banano",             "80.00",  "1/2 Und."),
        ("Cereza | Cherry",             "100.00", "1 Taza"),
        ("Ciruela",                     "100.00", "2 Und."),
        ("Ciruela de huesitos",         "100.00", "1 Taza"),
        ("Durazno",                     "100.00", "1 Und. Med."),
        ("Ensalada de frutas",          "0.00",   "1/4 Taza"),
        ("Frambuesa | Raspberry",       "160.00", "1 1/4 Taza"),
        ("Fresa | Strawberry | Frutilla","160.00","1 1/4 Taza"),
        ("Guanábana",                   "160.00", "1/2 Taza"),
        ("Guayaba",                     "100.00", "1 Und. Med."),
        ("Higo",                        "75.00",  "2 Und. Peq."),
        ("Kiwi",                        "100.00", "1 Und. Med."),
        ("Lechosa | Papaya",            "170.00", "1 Taza"),
        ("Limón",                       "100.00", "2 Und."),
        ("Mamón",                       "90.00",  "1/2 Taza"),
        ("Mandarina",                   "140.00", "1 Und. Med."),
        ("Mango",                       "100.00", "1/2 Und. Peq."),
        ("Manzana",                     "100.00", "1 Und. Peq."),
        ("Melocotón",                   "100.00", "1 Und. Med."),
        ("Melón",                       "300.00", "1 Taza"),
        ("Mora | Blackberry",           "100.00", "1 Taza"),
        ("Naranja",                     "140.00", "1 Und. Med."),
        ("Naranja en jugo",             "125.00", "1/2 Vaso"),
        ("Níspero",                     "90.00",  "1 Und. Med."),
        ("Parchita | Maracuyá",         "140.00", "1/2 Taza"),
        ("Pasas",                       "0.00",   "1 Cucharada"),
        ("Patilla | Sandía",            "300.00", "1 1/4 Taza"),
        ("Pera",                        "90.00",  "1 Und. Med."),
        ("Piña",                        "100.00", "1 Rodaja"),
        ("Pitahaya",                    "90.00",  "1/2 Taza"),
        ("Tamarindo",                   "0.00",   "1/4 Taza"),
        ("Toronja | Grapefruit",        "200.00", "1/2 Und."),
        ("Uvas",                        "100.00", "7 Und. Gde."),
    ],

    # -------------------------------------------------------------------------
    # ACOMPAÑANTES  (cereales, contornos, tubérculos, granos, panes, galletas)
    # -------------------------------------------------------------------------
    "Acompañantes": [
        # Cereales
        ("Avena en Hojuelas",                   "0.00",   "1/2 Taza"),
        ("Avena en Harina",                     "0.00",   "2 Cucharadas"),
        ("Harina de Cebada",                    "0.00",   "1/2 Taza"),
        ("Harina de Arroz",                     "0.00",   "1/2 Taza"),
        ("Harina de maíz tostado (fororo)",     "0.00",   "1/2 Taza"),
        ("Arroz tostado",                       "0.00",   "1/2 Taza"),
        ("Germen de trigo",                     "0.00",   "1/2 Taza"),
        ("Hojuelas de maíz no azucarada",       "0.00",   "3/4 Taza"),
        ("Cereal integral no azucarado",        "0.00",   "1/2 Taza"),
        ("Trigo inflado",                       "0.00",   "1/2 Taza"),
        # Contornos
        ("Arepa Asada",                         "50.00",  "1 Unidad Pequeña"),
        ("Arroz cocido",                        "100.00", "1/2 Taza"),
        ("Hallaquita | Bollito",                "50.00",  "1 Unidad Mediana"),
        ("Maíz entero | Mazorca | Choclo",      "90.00",  "1 Trozo cocido"),
        ("Pasta cocida",                        "100.00", "1/2 Taza"),
        ("Plátano cocido",                      "50.00",  "1/4 Unidad"),
        ("Quinoa | Quinua cocida",              "100.00", "1/2 Taza"),
        # Tubérculos
        ("Apio entero",                         "90.00",  "1/2 Taza cocida"),
        ("Batata entera",                       "90.00",  "1/2 Taza cocida"),
        ("Ñame entero",                         "90.00",  "1/2 Taza cocida"),
        ("Ocumo entero",                        "90.00",  "1/2 Taza cocida"),
        ("Papa entera",                         "90.00",  "1 Trozo cocido"),
        ("Yuca entera",                         "90.00",  "1 Trozo cocido"),
        ("Puré de cualquier tubérculo",         "90.00",  "1/2 Taza cocida"),
        # Granos o Leguminosas
        ("Arveja | Alverja",                    "100.00", "1/2 Taza cocida"),
        ("Caraotas | Frijol negro",             "100.00", "1/2 Taza cocida"),
        ("Frijol Rojo",                         "100.00", "1/2 Taza cocida"),
        ("Garbanzo",                            "100.00", "1/2 Taza cocida"),
        ("Lentejas",                            "100.00", "1/2 Taza cocida"),
        ("Soya",                                "100.00", "1/2 Taza cocida"),
        # Panes
        ("Pan árabe",                           "0.00",   "1/4 Unidad"),
        ("Bagel",                               "50.00",  "1/2 Unidad"),
        ("Baguette, Francés, Campesino, Canilla","30.00", "1 Trozo"),
        ("Pan sándwich blanco",                 "0.00",   "1 Rebanada"),
        ("Pan sándwich ligero",                 "0.00",   "2 Rebanadas"),
        ("Pan de hamburguesa o perro caliente", "50.00",  "1/2 Unidad"),
        ("Casabe | Croqueta de yuca",           "25.00",  "2 Unidades Medianas"),
        ("Tortilla de trigo",                   "50.00",  "1 Unidad Mediana"),
        ("Panqueca y Waffles, Cachapas",        "50.00",  "1 Unidad Pequeña"),
        ("Pan pita",                            "0.00",   "1/2 Unidad"),
        ("Pan dulce sin azúcar por encima",     "25.00",  "1 Rebanada"),
        ("Pan rallado",                         "20.00",  "3 Cucharadas"),
        # Galletas o Tortas
        ("Galletas de arroz inflado",           "0.00",   "2 Unidades"),
        ("Galletas de soda",                    "0.00",   "1 Paquete"),
        ("Galletas integrales",                 "0.00",   "1 Paquete"),
        ("Galletas tipo maría",                 "0.00",   "1/2 Paquete"),
        ("Señoritas | Palitroque",              "0.00",   "2 Unidades"),
        ("Galletas de avena o naranja",         "0.00",   "1 Unidad Mediana"),
        ("Galleta tipo pasta seca sin crema",   "0.00",   "3 Unidades Pequeñas"),
        ("Torta tipo ponqué sin crema",         "25.00",  "1 Rebanada"),
        ("Brownie",                             "25.00",  "1 Rebanada"),
        ("Muffin",                              "25.00",  "1/2 Unidad"),
        ("Barra de cereales",                   "0.00",   "1 Unidad Mediana"),
        ("Cotufas | Palomitas de maíz",         "0.00",   "2 a 3 Tazas"),
    ],

    # -------------------------------------------------------------------------
    # PROTEÍNAS
    # -------------------------------------------------------------------------
    "Proteínas": [
        # Carne de Res
        ("Carne de res entera (Milanesa, medallón, otro)",  "30.00", "1 Porción"),
        ("Carne de res molida o desmechada",                "30.00", "2 Cucharadas"),
        # Carne de Aves
        ("Pollo, gallina o pavo entero (Milanesa, medallón, presa)", "30.00", "1 Porción"),
        ("Pollo, gallina o pavo molido o desmechado",       "30.00", "2 Cucharadas"),
        # Pescado Fresco
        ("Pescado fresco filete o entero",                  "30.00", "1 Porción"),
        ("Pescado fresco desmenuzado",                      "30.00", "2 Cucharadas"),
        # Carne de Cerdo
        ("Carne de cerdo entera (Milanesa, medallón, presa)", "30.00", "1 Porción"),
        ("Carne de cerdo molida",                           "30.00", "2 Cucharadas"),
        # Mariscos
        ("Cangrejo, Camarón, calamar, langosta",            "30.00", "1/2 Taza"),
        # Vísceras
        ("Hígado de res",                                   "30.00", "1 Porción"),
        # Huevos
        ("Huevo entero, revuelto, a la plancha",            "0.00",  "1 Unidad"),
        ("Claras de huevo",                                 "0.00",  "2 Unidades"),
        # Quesos
        ("Ricota, requesón o cuajada",                      "30.00", "1/4 Taza"),
        ("Mozarella o descremado",                          "30.00", "1 Rebanada"),
        ("Queso blanco bajo en sal",                        "30.00", "1 Porción o 2 cdas."),
        ("Queso blanco semigraso",                          "30.00", "1 Porción o 2 cdas."),
        ("Queso amarillo, pecorino, azul, cheddar",         "30.00", "1 Rebanada"),
        # Embutidos
        ("Jamón (pavo, pollo o pierna de cerdo)",           "30.00", "1 Rebanada"),
        ("Salchicha de pollo o pavo",                       "30.00", "1 Unidad"),
    ],

    # -------------------------------------------------------------------------
    # GRASAS
    # -------------------------------------------------------------------------
    "Grasas": [
        # Insaturadas
        ("Aceite (maíz, girasol, oliva, ajonjolí, coco)",  "5.00",  "1 Cucharadita"),
        ("Aceitunas",                                       "0.00",  "5 Und. Grandes"),
        ("Aguacate",                                        "10.00", "1 Lonja fina"),
        ("Margarina",                                       "5.00",  "1 Cucharadita"),
        # Frutos Secos
        ("Almendra, Merey o Avellana",                      "0.00",  "6 Unidades"),
        ("Maní en concha",                                  "0.00",  "10 Unidades"),
        ("Maní sin concha",                                 "0.00",  "20 Unidades"),
        ("Nueces",                                          "0.00",  "2 Unidades"),
        ("Coco rallado",                                    "0.00",  "2 Cucharaditas"),
        ("Harina de frutos secos",                          "0.00",  "2 Cucharaditas"),
        ("Mantequilla de maní",                             "5.00",  "1 Cucharadita"),
        # Aderezos
        ("Vinagreta ligera",                                "10.00", "2 Cucharaditas"),
        ("Salsa italiana o americana ligera",               "15.00", "1 Cucharada"),
        ("Mostaza",                                         "5.00",  "1 Cucharadita"),
        ("Mayonesa natural o ligera",                       "5.00",  "1 Cucharadita"),
        ("Aderezo dulce (no graso)",                        "5.00",  "1 Cucharadita"),
        # Saturadas
        ("Crema agria",                                     "10.00", "2 Cucharaditas"),
        ("Suero de leche",                                  "10.00", "2 Cucharaditas"),
        ("Crema de leche",                                  "15.00", "1 Cucharada"),
        ("Queso Crema",                                     "15.00", "1 Cucharada"),
        ("Mantequilla",                                     "5.00",  "1 Cucharadita"),
        ("Tocineta",                                        "20.00", "1 Lonja fina"),
    ],
}

# ---------------------------------------------------------------------------
# Datos ficticios para pacientes
# ---------------------------------------------------------------------------

NOMBRES = ["Carlos", "María", "Luis", "Ana", "José", "Laura", "Miguel", "Sofía",
           "Pedro", "Isabella", "Jorge", "Valentina", "Andrés", "Camila", "Ricardo",
           "Daniela", "Fernando", "Gabriela", "Roberto", "Alejandra"]
APELLIDOS = ["González", "Rodríguez", "Martínez", "López", "García", "Pérez",
             "Sánchez", "Ramírez", "Torres", "Flores", "Rivera", "Gómez",
             "Díaz", "Reyes", "Morales", "Jiménez", "Herrera", "Medina", "Castro", "Vargas"]
ESTADOS_CIVIL = ["S", "C", "D", "V", "U"]
SEXOS = ["M", "F"]
OCUPACIONES = ["Docente", "Ingeniero/a", "Médico/a", "Abogado/a", "Contador/a",
                "Estudiante", "Ama de casa", "Comerciante", "Enfermero/a", "Arquitecto/a"]
RELIGIONES = ["Católica", "Evangélica", "Ninguna", "Otra"]
GRADOS = ["Primaria", "Secundaria", "Técnico", "Universitario", "Postgrado"]
MOTIVOS = [
    "Control de peso y reducción de grasa corporal",
    "Manejo de diabetes tipo 2",
    "Hipertensión arterial y dieta baja en sodio",
    "Pérdida de peso por indicación médica",
    "Asesoría nutricional post-quirúrgica",
    "Control de colesterol elevado",
    "Nutrición deportiva y rendimiento",
    "Anemia ferropénica - orientación dietética",
]
ANT_PERSONALES = [
    "Hipertensión arterial en tratamiento farmacológico",
    "Diabetes mellitus tipo 2, diagnosticada hace 5 años",
    "Sin antecedentes patológicos de importancia",
    "Dislipidemia mixta. Cirugía abdominal previa (apendicectomía)",
    "Hipotiroidismo. Reflujo gastroesofágico",
]
ANT_FAMILIARES = [
    "Madre: diabetes tipo 2. Padre: hipertensión arterial",
    "Abuelos paternos con antecedente de cardiopatía",
    "Sin antecedentes familiares relevantes",
    "Hermano: obesidad mórbida. Madre: dislipidemias",
    "Historia familiar de cáncer de colon",
]
TIPOS_DIETA = ["Hipocalórica", "Normocalórica", "Hipercalórica",
               "Hiposódica", "Diabética", "Baja en grasas", "Mediterránea"]
TIEMPOS_COMIDA_NOMBRES = [
    ["Desayuno", "Merienda AM", "Almuerzo", "Merienda PM", "Cena"],
    ["Desayuno", "Almuerzo", "Cena"],
    ["Desayuno", "Media Mañana", "Almuerzo", "Merienda", "Cena", "Colación Nocturna"],
]
COMIDAS_RECORDATORIO = ["Desayuno", "Media Mañana", "Almuerzo", "Merienda", "Cena"]


def _rand_decimal(lo, hi, decimals=2):
    val = random.uniform(lo, hi)
    return Decimal(str(round(val, decimals)))


def _rand_medio(lo, hi):
    """Genera valor aleatorio redondeado a entero o medio (0.5)."""
    val = random.uniform(lo, hi)
    rounded = round(val * 2) / 2
    return Decimal(str(rounded))


def _rand_date(years_ago_min=0, years_ago_max=2):
    days = random.randint(years_ago_min * 365, years_ago_max * 365)
    return date.today() - timedelta(days=days)


# ---------------------------------------------------------------------------

class Command(BaseCommand):
    help = "Borra y/o genera datos falsos para desarrollo."

    def add_arguments(self, parser):
        parser.add_argument(
            "--base",
            action="store_true",
            help="Genera solo datos mínimos: admin, nutricionista demo, catálogo de alimentos.",
        )
        parser.add_argument(
            "--completo",
            action="store_true",
            help="Genera datos base + pacientes con todo su expediente, planes, exámenes, etc.",
        )
        parser.add_argument(
            "--pacientes",
            type=int,
            default=10,
            metavar="N",
            help="Cantidad de pacientes a crear en modo --completo (default: 10).",
        )
        parser.add_argument(
            "--flush",
            action="store_true",
            help="Borra toda la data antes de sembrar (pide confirmación interactiva).",
        )
        parser.add_argument(
            "--flush-confirm",
            action="store_true",
            help="Igual que --flush pero sin pedir confirmación (útil para CI/CD).",
        )

    # ------------------------------------------------------------------
    def handle(self, *args, **options):
        base = options["base"]
        completo = options["completo"]
        flush = options["flush"]
        flush_confirm = options["flush_confirm"]
        n_pacientes = options["pacientes"]

        if not base and not completo:
            raise CommandError(
                "Debes especificar al menos un modo: --base o --completo\n"
                "Ejecuta con --help para ver todas las opciones."
            )

        # ---- Flush -------------------------------------------------------
        if flush or flush_confirm:
            if flush and not flush_confirm:
                self.stdout.write(self.style.WARNING(
                    "\n⚠️  Se borrarán TODOS los datos del sistema."
                ))
                confirmacion = input("¿Confirmas? Escribe 'si' para continuar: ").strip().lower()
                if confirmacion != "si":
                    self.stdout.write(self.style.ERROR("Operación cancelada."))
                    return
            self._flush()

        # ---- Seed --------------------------------------------------------
        self._seed_base()

        if completo:
            self._seed_completo(n_pacientes)

        self.stdout.write(self.style.SUCCESS("\n✅  seed_data finalizado correctamente."))

    # ------------------------------------------------------------------
    # FLUSH
    # ------------------------------------------------------------------
    def _flush(self):
        self.stdout.write(self.style.WARNING("🗑️  Eliminando datos..."))

        # Orden inverso de dependencias
        EntradaRecordatorio.objects.all().delete()
        RecordatorioAlimentario.objects.all().delete()
        RacionPlan.objects.all().delete()
        TiempoComida.objects.all().delete()
        PlanAlimenticio.objects.all().delete()
        ConsumoCaloricoItem.objects.all().delete()
        ExamenBioquimico.objects.all().delete()
        RegistroProgreso.objects.all().delete()
        ExpedienteClinico.objects.all().delete()
        Paciente.objects.all().delete()
        Alimento.objects.all().delete()
        GrupoAlimento.objects.all().delete()

        # Usuarios no-superusuarios
        User.objects.filter(is_superuser=False).delete()

        self.stdout.write(self.style.WARNING("   ✔ Datos eliminados.\n"))

    # ------------------------------------------------------------------
    # DATOS BASE
    # ------------------------------------------------------------------
    def _seed_base(self):
        self.stdout.write("📦  Generando datos base...")

        # Grupos de Django
        nutricionista_group, _ = Group.objects.get_or_create(name="Nutricionista")
        paciente_group, _ = Group.objects.get_or_create(name="Paciente")
        secretario_group, _ = Group.objects.get_or_create(name="Secretario")
        self.stdout.write(f"   ✔ Grupos 'Nutricionista', 'Paciente' y 'Secretario' listos.")

        # Usuario admin
        if not User.objects.filter(username="admin").exists():
            User.objects.create_superuser(
                username="admin",
                password="admin1234",
                email="admin@nutriapp.local",
                first_name="Admin",
                last_name="Sistema",
            )
            self.stdout.write("   ✔ Superusuario 'admin' creado (pass: admin1234).")
        else:
            self.stdout.write("   · Superusuario 'admin' ya existe, se omite.")

        # Usuario nutricionista demo
        if not User.objects.filter(username="nutricionista").exists():
            nutri = User.objects.create_user(
                username="nutricionista",
                password="nutri1234",
                email="nutri@nutriapp.local",
                first_name="Nutricionista",
                last_name="Demo",
            )
            nutri.groups.add(nutricionista_group)
            self.stdout.write("   ✔ Usuario 'nutricionista' creado (pass: nutri1234).")
        else:
            self.stdout.write("   · Usuario 'nutricionista' ya existe, se omite.")

        # Usuario secretario demo
        if not User.objects.filter(username="secretaria").exists():
            secre = User.objects.create_user(
                username="secretaria",
                password="secretaria123",
                email="secretaria@nutriapp.local",
                first_name="Secretaria",
                last_name="Demo",
            )
            secre.groups.add(secretario_group)
            self.stdout.write("   ✔ Usuario 'secretaria' creado (pass: secretaria123).")
        else:
            self.stdout.write("   · Usuario 'secretaria' ya existe, se omite.")

        # Usuario paciente demo
        if not User.objects.filter(username="paciente_demo").exists():
            pac_user = User.objects.create_user(
                username="paciente_demo",
                password="paciente123",
                email="paciente@nutriapp.local",
                first_name="Paciente",
                last_name="Demo",
            )
            pac_user.groups.add(paciente_group)
            Paciente.objects.get_or_create(
                user=pac_user,
                defaults={
                    "cedula": "00000001",
                    "sexo": "F",
                    "fecha_nacimiento": "1990-01-01",
                },
            )
            self.stdout.write("   ✔ Usuario 'paciente_demo' creado (pass: paciente123).")
        else:
            self.stdout.write("   · Usuario 'paciente_demo' ya existe, se omite.")

        # Catálogo: Grupos de alimentos + Alimentos
        grupos_creados = 0
        alimentos_creados = 0
        for g_data in GRUPOS_BASE:
            grupo, created = GrupoAlimento.objects.get_or_create(
                nombre=g_data["nombre"],
                defaults={
                    "kcal_racion": Decimal(g_data["kcal_racion"]),
                    "proteina_g":  Decimal(g_data["proteina_g"]),
                    "carb_g":      Decimal(g_data["carb_g"]),
                    "grasa_g":     Decimal(g_data["grasa_g"]),
                },
            )
            if created:
                grupos_creados += 1

            for nombre_ali, porcion, unidad in ALIMENTOS_BASE.get(g_data["nombre"], []):
                _, ali_created = Alimento.objects.get_or_create(
                    grupo=grupo,
                    nombre=nombre_ali,
                    defaults={"porcion_g": Decimal(porcion), "unidad": unidad},
                )
                if ali_created:
                    alimentos_creados += 1

        self.stdout.write(
            f"   ✔ Catálogo: {grupos_creados} grupos y {alimentos_creados} alimentos creados."
        )

    # ------------------------------------------------------------------
    # DATOS COMPLETOS
    # ------------------------------------------------------------------
    def _seed_completo(self, n_pacientes):
        self.stdout.write(f"\n🏥  Generando {n_pacientes} pacientes con datos completos...")

        nutri_group = Group.objects.get(name="Nutricionista")
        paciente_group, _ = Group.objects.get_or_create(name="Paciente")
        grupos = list(GrupoAlimento.objects.all())
        nutri_user = User.objects.filter(groups=nutri_group).first()

        if not grupos:
            raise CommandError("No hay grupos de alimentos. Ejecuta primero --base.")

        nombres_usados = set(User.objects.values_list("username", flat=True))

        for i in range(n_pacientes):
            nombre = random.choice(NOMBRES)
            apellido1 = random.choice(APELLIDOS)
            apellido2 = random.choice(APELLIDOS)
            apellido_completo = f"{apellido1} {apellido2}"

            # Username único
            base_username = f"{nombre.lower()}.{apellido1.lower()}"
            username = base_username
            sufijo = 1
            while username in nombres_usados:
                username = f"{base_username}{sufijo}"
                sufijo += 1
            nombres_usados.add(username)

            sexo = random.choice(SEXOS)
            ano_nac = random.randint(1950, 2000)
            mes_nac = random.randint(1, 12)
            dia_nac = random.randint(1, 28)

            # Usuario
            user = User.objects.create_user(
                username=username,
                password="paciente1234",
                email=f"{username}@mail.com",
                first_name=nombre,
                last_name=apellido_completo,
            )
            user.groups.add(paciente_group)

            # Paciente
            paciente = Paciente.objects.create(
                user=user,
                cedula=str(random.randint(5_000_000, 30_000_000)),
                fecha_nacimiento=date(ano_nac, mes_nac, dia_nac),
                lugar_nacimiento=random.choice(["Caracas", "Maracaibo", "Valencia", "Barquisimeto", "Mérida"]),
                sexo=sexo,
                estado_civil=random.choice(ESTADOS_CIVIL),
                telefono=f"0412{random.randint(1000000, 9999999)}",
                direccion=f"Av. Principal, Res. {apellido1}, Piso {random.randint(1,10)}, Apto {random.randint(1,20)}",
                religion=random.choice(RELIGIONES),
                grado_instruccion=random.choice(GRADOS),
                ocupacion=random.choice(OCUPACIONES),
                historia_nro=f"HN-{random.randint(1000, 9999)}",
            )

            # Expediente clínico
            expediente = ExpedienteClinico.objects.create(
                paciente=paciente,
                motivo_consulta=random.choice(MOTIVOS),
                ant_personales=random.choice(ANT_PERSONALES),
                ant_familiares=random.choice(ANT_FAMILIARES),
                cafeinicos_v_dia=random.randint(0, 4),
                alcohol=random.choice(["No", "Ocasional", "Semanal"]),
                sueno_hr_dia=_rand_decimal(5, 9, 1),
                apetito=random.choice(["NORMAL", "AUMENTADO", "DISMINUIDO"]),
                micciones_v_dia=str(random.randint(3, 8)),
                evacuaciones_v_dia=random.randint(1, 3),
                actividad_fisica=random.choice(["Sedentario", "Camina 30 min/día", "Ejercicio 3x/semana", "Deportista"]),
                tg_dispepsia=random.choice([True, False]),
                tg_distension=random.choice([True, False]),
                tg_aerofagia=random.choice([True, False]),
                tg_flatulencia=random.choice(["Leve", "Moderada", ""]),
                tg_meteorismo=random.choice([True, False]),
                tg_diarrea=False,
                tg_nauseas=random.choice([True, False]),
                tg_vomitos=False,
                tg_rgef=random.choice([True, False]),
                estrenimiento=random.choice(["NO", "LEVE", "MODERADO", "CRONICO"]),
                alergias_alimentarias=random.choice(["Ninguna", "Mariscos", "Lactosa", "Gluten"]),
                peso_maximo_kg=_rand_decimal(70, 120),
                peso_minimo_kg=_rand_decimal(55, 70),
                peso_usual_kg=_rand_decimal(65, 100),
                peso_ideal_kg=_rand_decimal(55, 75),
                peso_deseado_kg=_rand_decimal(55, 80),
                circunferencia_muneca_cm=_rand_decimal(14, 18),
                contextura=random.choice(["Pequeña", "Mediana", "Grande"]),
                diagnostico_nutricional=random.choice([
                    "Obesidad Grado I",
                    "Sobrepeso",
                    "Normopeso con dislipidemia",
                    "Desnutrición leve",
                    "Obesidad Grado II con síndrome metabólico",
                ]),
            )

            # Consumo calórico diario
            grupos_choices = ["LECHE","CARNES_A","CARNES_B","VEGETALES","FRUTAS","ALMIDONES","GRASAS","AZUCAR","SOPORTE"]
            for orden, grupo_key in enumerate(grupos_choices):
                if random.random() < 0.75:  # no todos los grupos siempre
                    ConsumoCaloricoItem.objects.create(
                        expediente=expediente,
                        grupo=grupo_key,
                        intercambios=_rand_medio(0.5, 4),
                        proteinas_g=_rand_decimal(0, 20),
                        grasas_g=_rand_decimal(0, 15),
                        cho_g=_rand_decimal(0, 30),
                        kcal=_rand_decimal(50, 400),
                        orden=orden,
                    )

            # Exámenes bioquímicos (1 o 2)
            for _ in range(random.randint(1, 2)):
                ExamenBioquimico.objects.create(
                    paciente=paciente,
                    fecha=_rand_date(0, 1),
                    proteinas_totales=_rand_decimal(6, 8),
                    albumina=_rand_decimal(3.5, 5),
                    globulina=_rand_decimal(2, 3.5),
                    urea=_rand_decimal(15, 45),
                    creatinina=_rand_decimal(0.6, 1.2),
                    acido_urico=_rand_decimal(2.5, 7),
                    colesterol=_rand_decimal(130, 250),
                    hdl=_rand_decimal(35, 80),
                    ldl=_rand_decimal(60, 180),
                    vldl=_rand_decimal(10, 40),
                    trigliceridos=_rand_decimal(50, 250),
                    glucosa=_rand_decimal(70, 130),
                    hemoglobina=_rand_decimal(11, 17),
                    hematocrito=_rand_decimal(33, 52),
                    tsh=_rand_decimal(0.4, 4),
                    hierro=_rand_decimal(50, 170),
                    sodio=_rand_decimal(135, 145),
                    potasio=_rand_decimal(3.5, 5),
                    cloro=_rand_decimal(98, 107),
                    calcio=_rand_decimal(8.5, 10.5),
                )

            # Registros de progreso (2 a 5 consultas)
            peso_actual = float(_rand_decimal(65, 110))
            talla = float(_rand_decimal(150, 185))
            for j in range(random.randint(2, 5)):
                fecha_prog = date.today() - timedelta(days=j * 30 + random.randint(0, 10))
                peso_actual = max(50, peso_actual - random.uniform(-0.5, 1.5))
                RegistroProgreso.objects.create(
                    paciente=paciente,
                    fecha=fecha_prog,
                    peso_kg=_rand_decimal(peso_actual - 1, peso_actual + 1),
                    talla_cm=Decimal(str(round(talla, 2))),
                    cintura_cm=_rand_decimal(70, 110),
                    cadera_cm=_rand_decimal(85, 120),
                    notas=random.choice(["Buena adherencia al plan", "Refiere dificultad con el plan", "Sin novedades", ""]),
                    creado_por=nutri_user,
                )

            # Plan alimenticio
            plan = PlanAlimenticio.objects.create(
                paciente=paciente,
                fecha_inicio=_rand_date(0, 1),
                activo=True,
                tipo_dieta=random.choice(TIPOS_DIETA),
                kcal_objetivo=random.choice([1200, 1400, 1500, 1800, 2000, 2200]),
                pct_proteinas=_rand_decimal(15, 25),
                pct_grasas=_rand_decimal(20, 35),
                pct_carbohidratos=_rand_decimal(45, 60),
                requerimiento_hidrico_ml=random.choice([1500, 1800, 2000, 2500]),
                fibra_g=_rand_decimal(20, 35),
                notas="Plan generado por seed_data.",
            )

            tiempos_nombres = random.choice(TIEMPOS_COMIDA_NOMBRES)
            grupos_disponibles = list(grupos)
            for orden, tc_nombre in enumerate(tiempos_nombres):
                tc = TiempoComida.objects.create(plan=plan, nombre=tc_nombre, orden=orden)
                grupos_tiempo = random.sample(grupos_disponibles, k=min(3, len(grupos_disponibles)))
                grupos_usados = set()
                for grupo in grupos_tiempo:
                    if grupo.pk in grupos_usados:
                        continue
                    grupos_usados.add(grupo.pk)
                    RacionPlan.objects.create(
                        tiempo_comida=tc,
                        grupo=grupo,
                        cantidad=_rand_medio(0.5, 3),
                    )

            # Recordatorio alimentario
            rec = RecordatorioAlimentario.objects.create(
                paciente=paciente,
                fecha=_rand_date(0, 0),
                creado_por=nutri_user,
            )
            for orden, nombre_comida in enumerate(COMIDAS_RECORDATORIO):
                EntradaRecordatorio.objects.create(
                    recordatorio=rec,
                    nombre=nombre_comida,
                    orden=orden,
                    descripcion=random.choice([
                        "Arepa con queso blanco y jugo natural",
                        "Ensalada mixta con pollo a la plancha",
                        "Arroz integral, caraotas, pollo y ensalada",
                        "Fruta de temporada",
                        "Yogur con avena y frutas",
                        "Sopa de vegetales con pasta integral",
                    ]),
                )

            self.stdout.write(f"   ✔ [{i+1}/{n_pacientes}] {user.get_full_name()} ({username})")

        self.stdout.write(self.style.SUCCESS(f"\n   Total pacientes creados: {n_pacientes}"))
