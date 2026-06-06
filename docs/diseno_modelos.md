# Diseño de Modelos Django — Sistema Nutricional

## Stack

- Backend: Django + Django REST Framework
- Frontend: React.js
- DB: SQLite (dev) → PostgreSQL (prod)
- Auth: Session (dev) → JWT (futuro)

---

## Estructura de Apps

```
server/apps/
  users/       → User, Paciente
  expediente/  → ExpedienteClinico, RegistroProgreso, ExamenBioquimico,
                 RecordatorioAlimentario, EntradaRecordatorio
  catalogo/    → GrupoAlimento, Alimento
  planes/      → PlanAlimenticio, TiempoComida, RacionPlan
```

---

## App: `users`

### `User` (extiende AbstractUser)

Sin campos extra. Usa grupos Django nativos para permisos.

> `AUTH_USER_MODEL = 'users.User'`  
> Grupos: `Nutricionista`, `Paciente`, `Admin` — creados via fixture/migration.  
> Solo 1 nutricionista en esta fase.

### `Paciente`

| Campo             | Tipo                        | Notas             |
| ----------------- | --------------------------- | ----------------- |
| user              | OneToOneField(User)         |                   |
| cedula            | CharField                   |                   |
| fecha_nacimiento  | DateField(null)             |                   |
| lugar_nacimiento  | CharField                   |                   |
| sexo              | CharField(choices)          | M / F / O         |
| estado_civil      | CharField(choices)          | S / C / D / V / U |
| telefono          | CharField                   |                   |
| direccion         | TextField                   |                   |
| religion          | CharField                   |                   |
| grado_instruccion | CharField                   |                   |
| ocupacion         | CharField                   |                   |
| referido_por      | CharField                   |                   |
| historia_nro      | CharField                   |                   |
| consultorio       | CharField                   |                   |
| created_at        | DateTimeField(auto_now_add) |                   |

---

## App: `expediente`

### `ExpedienteClinico`

OneToOne → Paciente. Datos de anamnesis clínica estáticos.

| Campo                             | Tipo                            | Notas                           |
| --------------------------------- | ------------------------------- | ------------------------------- |
| paciente                          | OneToOneField(Paciente)         |                                 |
| motivo_consulta                   | TextField                       |                                 |
| **Antecedentes**                  |                                 |                                 |
| ant_personales                    | TextField                       |                                 |
| ant_familiares                    | TextField                       |                                 |
| menarquia_anos                    | PositiveSmallIntegerField(null) | Solo femenino                   |
| fecha_ultima_menstruacion         | DateField(null)                 | Solo femenino                   |
| num_embarazos                     | PositiveSmallIntegerField(null) | Solo femenino                   |
| edad_ultimo_embarazo              | PositiveSmallIntegerField(null) | Solo femenino                   |
| **Hábitos psicobiológicos**       |                                 |                                 |
| cafeinicos_v_dia                  | PositiveSmallIntegerField(null) | veces/día                       |
| alcohol                           | CharField(null)                 | OC / NO / cantidad              |
| tabaquicos_und_dia                | PositiveSmallIntegerField(null) | und/día                         |
| sueno_hr_dia                      | DecimalField(null)              | horas/día                       |
| apetito                           | CharField(null)                 | NORMAL / AUMENTADO / DISMINUIDO |
| micciones_v_dia                   | CharField(null)                 | ej. "5-6"                       |
| evacuaciones_v_dia                | PositiveSmallIntegerField(null) |                                 |
| actividad_fisica                  | TextField(blank)                | descripción libre               |
| **Trastornos gastrointestinales** |                                 |                                 |
| tg_dispepsia                      | BooleanField(default=False)     |                                 |
| tg_distension                     | BooleanField(default=False)     |                                 |
| tg_aerofagia                      | BooleanField(default=False)     |                                 |
| tg_flatulencia                    | CharField(blank)                | puede tener nota                |
| tg_meteorismo                     | BooleanField(default=False)     |                                 |
| tg_diarrea                        | BooleanField(default=False)     |                                 |
| tg_nauseas                        | BooleanField(default=False)     |                                 |
| tg_vomitos                        | BooleanField(default=False)     |                                 |
| tg_rgef                           | BooleanField(default=False)     | Reflujo                         |
| estrenimiento                     | CharField(choices, null)        | NO / LEVE / MODERADO / CRONICO  |
| **Alergias**                      |                                 |                                 |
| alergias_alimentarias             | TextField(blank)                |                                 |
| **Tratamientos actuales**         |                                 |                                 |
| trat_farmacologico                | TextField(blank)                |                                 |
| trat_suplemento_oral              | TextField(blank)                | vitaminas/minerales             |
| trat_otros                        | TextField(blank)                |                                 |
| **Pesos referenciales**           |                                 |                                 |
| peso_maximo_kg                    | DecimalField(null)              | dato histórico ingresado        |
| peso_minimo_kg                    | DecimalField(null)              |                                 |
| peso_usual_kg                     | DecimalField(null)              |                                 |
| peso_ideal_kg                     | DecimalField(null)              |                                 |
| peso_deseado_kg                   | DecimalField(null)              |                                 |
| circunferencia_muneca_cm          | DecimalField(null)              | para contextura                 |
| **Diagnóstico**                   |                                 |                                 |
| diagnostico_nutricional           | TextField(blank)                | texto clínico libre             |
| updated_at                        | DateTimeField(auto_now)         |                                 |

---

### `RegistroProgreso`

Tabla histórica de antropometría. Editable por paciente y nutricionista.

| Campo      | Tipo                        | Notas                                    |
| ---------- | --------------------------- | ---------------------------------------- |
| paciente   | ForeignKey(Paciente)        |                                          |
| fecha      | DateField                   |                                          |
| peso_kg    | DecimalField                |                                          |
| talla_cm   | DecimalField(null)          | incluida en tabla antropométrica del XLS |
| cintura_cm | DecimalField(null)          |                                          |
| cadera_cm  | DecimalField(null)          |                                          |
| notas      | TextField(blank)            |                                          |
| creado_por | ForeignKey(User)            | paciente o nutricionista                 |
| created_at | DateTimeField(auto_now_add) |                                          |

> IMC, MB, %GC, %MS, %GV → cálculos del sistema, no campos.

---

### `ExamenBioquimico`

Tabla histórica de laboratorio. Una fila por fecha de examen.

| Campo                   | Tipo                 | Panel |
| ----------------------- | -------------------- | ----- |
| paciente                | ForeignKey(Paciente) |       |
| fecha                   | DateField            |       |
| **Proteínas**           |                      |       |
| proteinas_totales       | DecimalField(null)   | PT    |
| albumina                | DecimalField(null)   | ALB   |
| globulina               | DecimalField(null)   | GLO   |
| **Renal**               |                      |       |
| urea                    | DecimalField(null)   | UR    |
| creatinina              | DecimalField(null)   | CR    |
| acido_urico             | DecimalField(null)   | AU    |
| **Lípidos**             |                      |       |
| colesterol              | DecimalField(null)   | COL   |
| hdl                     | DecimalField(null)   |       |
| ldl                     | DecimalField(null)   |       |
| vldl                    | DecimalField(null)   |       |
| trigliceridos           | DecimalField(null)   | TGC   |
| **Glucosa / Insulina**  |                      |       |
| glucosa                 | DecimalField(null)   | GLI   |
| glucosa_postprandial    | DecimalField(null)   | GLI P |
| insulina                | DecimalField(null)   | IN    |
| insulina_postprandial   | DecimalField(null)   | IN P  |
| hemoglobina_glicosilada | DecimalField(null)   | HBA   |
| **Hepáticos**           |                      |       |
| tgo                     | DecimalField(null)   |       |
| tgp                     | DecimalField(null)   |       |
| bilirrubina_total       | DecimalField(null)   | BL T  |
| bilirrubina_directa     | DecimalField(null)   | BL D  |
| bilirrubina_indirecta   | DecimalField(null)   | BL I  |
| **Hematología**         |                      |       |
| hemoglobina             | DecimalField(null)   | HB    |
| hematocrito             | DecimalField(null)   | HCT   |
| **Tiroides**            |                      |       |
| t3                      | DecimalField(null)   |       |
| t4                      | DecimalField(null)   |       |
| tsh                     | DecimalField(null)   |       |
| **Minerales**           |                      |       |
| hierro                  | DecimalField(null)   | FE    |
| vitamina_b12            | DecimalField(null)   | B12   |
| sodio                   | DecimalField(null)   | NA    |
| potasio                 | DecimalField(null)   | K     |
| cloro                   | DecimalField(null)   | CL    |
| calcio                  | DecimalField(null)   | CA    |

---

### `RecordatorioAlimentario`

Cabecera del recordatorio 24h. Flexible: N comidas según paciente.

| Campo      | Tipo                        | Notas                    |
| ---------- | --------------------------- | ------------------------ |
| paciente   | ForeignKey(Paciente)        |                          |
| fecha      | DateField                   |                          |
| creado_por | ForeignKey(User)            | paciente o nutricionista |
| created_at | DateTimeField(auto_now_add) |                          |

### `EntradaRecordatorio`

Una fila por tiempo de comida.

| Campo        | Tipo                                | Notas                         |
| ------------ | ----------------------------------- | ----------------------------- |
| recordatorio | ForeignKey(RecordatorioAlimentario) |                               |
| nombre       | CharField                           | "Desayuno", "Merienda", libre |
| hora         | TimeField(null)                     |                               |
| descripcion  | TextField                           | texto libre                   |
| orden        | PositiveSmallIntegerField           | para ordenar en UI            |

---

## App: `catalogo`

### `GrupoAlimento`

Administrado por el nutricionista/admin. Base para intercambios libres.

| Campo       | Tipo              | Notas                            |
| ----------- | ----------------- | -------------------------------- |
| nombre      | CharField(unique) | Leche, Carnes A, Vegetales, etc. |
| kcal_racion | DecimalField      |                                  |
| proteina_g  | DecimalField      | g por ración                     |
| carb_g      | DecimalField      | g por ración                     |
| grasa_g     | DecimalField      | g por ración                     |

### `Alimento`

Alimentos específicos dentro de cada grupo.

| Campo     | Tipo                       | Notas                   |
| --------- | -------------------------- | ----------------------- |
| grupo     | ForeignKey(GrupoAlimento)  |                         |
| nombre    | CharField                  |                         |
| porcion_g | DecimalField               | gramos = 1 ración       |
| unidad    | CharField                  | "taza", "pieza", "cdas" |
| activo    | BooleanField(default=True) |                         |

> **Intercambio libre dentro del grupo:** el paciente puede sustituir
> cualquier alimento por otro del mismo grupo. No requiere modelo extra.
> El frontend filtra `Alimento` por `GrupoAlimento`.

---

## App: `planes`

### `PlanAlimenticio`

Incluye el tratamiento nutricional (inputs del nutricionista, no cálculos).

| Campo                       | Tipo                        | Notas                             |
| --------------------------- | --------------------------- | --------------------------------- |
| paciente                    | ForeignKey(Paciente)        |                                   |
| fecha_inicio                | DateField                   |                                   |
| fecha_fin                   | DateField(null)             |                                   |
| activo                      | BooleanField(default=True)  | solo 1 activo por paciente        |
| notas                       | TextField(blank)            |                                   |
| **Tratamiento nutricional** |                             |                                   |
| tipo_dieta                  | CharField(blank)            | texto libre                       |
| kcal_objetivo               | IntegerField(null)          | VCT — ingresado por nutricionista |
| pct_proteinas               | DecimalField(null)          | % distribución                    |
| pct_grasas                  | DecimalField(null)          | % distribución                    |
| pct_carbohidratos           | DecimalField(null)          | % distribución                    |
| requerimiento_hidrico_ml    | IntegerField(null)          | RH                                |
| fibra_g                     | DecimalField(null)          |                                   |
| sodio_mg                    | DecimalField(null)          | NA                                |
| potasio_mg                  | DecimalField(null)          | K                                 |
| cho_simples_g               | DecimalField(null)          | CHO simples                       |
| cloro_sodio_mg              | DecimalField(null)          | CL NA                             |
| suplemento_complemento      | TextField(blank)            |                                   |
| trat_otros                  | TextField(blank)            |                                   |
| created_at                  | DateTimeField(auto_now_add) |                                   |

> g/día y kcal/día por macro → cálculos del sistema desde % × kcal_objetivo.

### `TiempoComida`

Tiempos de comida del plan. Mismo patrón flexible que `EntradaRecordatorio`.

| Campo  | Tipo                        | Notas                           |
| ------ | --------------------------- | ------------------------------- |
| plan   | ForeignKey(PlanAlimenticio) |                                 |
| nombre | CharField                   | "Desayuno", "Colación AM", etc. |
| orden  | PositiveSmallIntegerField   |                                 |

### `RacionPlan`

Raciones por grupo en cada tiempo de comida.

| Campo         | Tipo                      | Notas            |
| ------------- | ------------------------- | ---------------- |
| tiempo_comida | ForeignKey(TiempoComida)  |                  |
| grupo         | ForeignKey(GrupoAlimento) |                  |
| cantidad      | DecimalField              | ej. 1.5 raciones |

---

## Resumen de Modelos

| App        | Modelos                                                                                             |
| ---------- | --------------------------------------------------------------------------------------------------- |
| users      | User, Paciente                                                                                      |
| expediente | ExpedienteClinico, RegistroProgreso, ExamenBioquimico, RecordatorioAlimentario, EntradaRecordatorio |
| catalogo   | GrupoAlimento, Alimento                                                                             |
| planes     | PlanAlimenticio, TiempoComida, RacionPlan                                                           |

**Total: 12 modelos**

---

## Decisiones de Diseño

| Decisión                                      | Razón                                                  |
| --------------------------------------------- | ------------------------------------------------------ |
| Intercambio libre dentro grupo                | No modelo extra. Frontend filtra por grupo.            |
| RecordatorioAlimentario + EntradaRecordatorio | Flexible 3-6 comidas sin cambiar modelo                |
| TratamientoNutricional dentro PlanAlimenticio | Son datos del mismo acto clínico                       |
| RegistroProgreso editable por ambos roles     | Campo `creado_por` FK User para auditoría              |
| ExamenBioquimico tabla separada con fecha     | Historial múltiple de laboratorio                      |
| Roles via grupos Django nativos               | Sin campo `rol` custom. Groups + permissions estándar. |
| 1 nutricionista fase 1                        | Sin multi-tenant ni permisos complejos                 |
