#

# **PROPUESTA ESTRATÉGICA DE TRANSFORMACIÓN DIGITAL: PLATAFORMA "NUTRIBARIÁTRICA HUB"**

## **![][image1]**

## **1\. Diagnóstico de la Situación Actual y Justificación**

---

El modelo operativo actual de la consulta médica se gestiona mediante herramientas de almacenamiento local e información fragmentada en hojas de cálculo estáticas. Si bien estas estructuras han permitido sostener la práctica clínica, presentan ineficiencias críticas que comprometen la escalabilidad del negocio y la seguridad de la información:

- **Vulnerabilidad de Datos Clínicos:** El almacenamiento exclusivo de expedientes como la "Historia Adultos" en el disco duro de una computadora local, sin respaldos automatizados en tiempo real o espejos en la nube, expone la práctica médica a una pérdida catastrófica de información.
- **Fuga de Pacientes por Pérdida de Propiedad Intelectual (IP):** Al entregar el "Plan Modelo" y las "Recomendaciones" en un archivo de Excel independiente, el paciente adquiere la propiedad completa del tratamiento desde la primera consulta. Esto elimina el incentivo financiero de regresar a las consultas de seguimiento.
- **Fricción por Configuración de Herramientas:** La imposibilidad de implementar la nueva tabla de conversión calórica debido a las limitaciones de configuración de las fórmulas de Excel demuestra que el software local ralentiza la evolución de los criterios nutricionales del especialista.
- **Desventaja Competitiva Generacional:** Los profesionales de reciente graduación están adoptando ecosistemas digitales interactivos, lo que genera una brecha en la experiencia de usuario de los pacientes que demandan interfaces optimizadas para dispositivos móviles.

## **2\. Enfoque de Solución: Progressive WebApp (PWA)**

---

Para resolver las problemáticas diagnosticadas, se ejecuta el desarrollo de una Aplicación Web Progresiva (WebApp / PWA) en lugar de una aplicación nativa para tiendas de descarga (iOS/Android). Los fundamentos de esta decisión técnica y de negocio son:

- **Compatibilidad Universal y Omnicanalidad:** Funciona de manera fluida en computadoras de escritorio, tabletas y teléfonos inteligentes (iOS y Android) desde cualquier navegador web (Chrome, Safari, Edge), eliminando la fricción de descargas o actualizaciones manuales por parte del usuario.
- **Inclusión Tecnológica Garantizada:** Conscientes de que existen pacientes de la tercera edad o con dificultades en el manejo de entornos digitales, la plataforma preserva el flujo de trabajo tradicional. El médico o la secretaria podrán seguir imprimiendo los planes o generando archivos PDF automatizados para ser enviados por WhatsApp o correo electrónico, adaptando el sistema al nivel digital del paciente.
- **Protección de la Propiedad Intelectual:** El plan de alimentación ya no se entrega en un formato editable descargable; se consume de manera dinámica dentro del portal del paciente, obligando a la interacción continua con el ecosistema del médico para visualizar la evolución del tratamiento.

## **3.Arquitectura Detallada de Módulos y Funcionalidades**

---

La solución se estructura como una Aplicación Web Progresiva (WebApp / PWA) con un núcleo de acceso centralizado. A continuación, se detalla exhaustivamente el alcance funcional de cada componente del ecosistema:

![][image2]

### **3.1. Portal Público y Landing Page (Centro de Captación)**

Esta es la cara pública del Dr. Domingo Porras, diseñada no solo como un folleto informativo, sino como un motor de conversión para agendar nuevas consultas.

- **Perfil Profesional y Especialidad:** Sección dedicada a la trayectoria del Dr. Porras, detallando su enfoque en cirugía bariátrica y manejo de enfermedades crónicas, acompañada de galerías de fotos (antes/después) e identidad corporativa.
- **Módulo Multimedia y Redes:** Integración de reproductores de video (ej. enlace a su entrevista en YouTube) para generar autoridad y confianza.
- **Widgets de Interacción Inmediata:** Botones flotantes y enlaces directos para contacto por WhatsApp y redes sociales, facilitando el agendamiento rápido.
- **Calculadora Métrica Interactiva (Lead Magnet):** Una herramienta pública donde el visitante puede ingresar su peso y altura para calcular su Índice de Masa Corporal (IMC). El resultado incluye un llamado a la acción (Call to Action) sugiriendo agendar una cita según el riesgo detectado.
- **Portal de Login Centralizado:** Un único formulario de acceso. El sistema, mediante validación de roles, redirigirá automáticamente al usuario a su panel correspondiente (Médico, Paciente o Secretaría). Incluye flujo automatizado de recuperación de contraseña vía correo electrónico.

### **3.2. Módulo del Médico (Centro de Comando Clínico)**

Diseñado para que el Dr. Porras controle el 100% del ecosistema, desde la creación del plan hasta la generación de documentos legales médicos.

- Ficha Clínica Digital Inteligente: Digitalización total del documento "Historia Adultos". Permite registrar de manera ágil el motivo de consulta, antecedentes personales/familiares y hábitos psicobiológicos (cafeínicos, tolerancia a alimentos).
- Motor de Conversión Calórica y Planificación: El fin del Excel. El doctor ingresa las calorías objetivo (ej. 1825 kcal) y el perfil (ej. Actividad Leve-HIIT). El sistema distribuye automáticamente las raciones según la nueva tabla de listas de intercambio (lácteos, carnes, grasas, frutas, etc.).
- Gestión de Pacientes y Código de Colores: Listado general de pacientes. El doctor podrá asignar un "color" a cada paciente dependiendo del tipo de dieta (ej. Hipocalórica baja en grasas, Pre-quirúrgica), y podrá activar o desactivar perfiles (para pacientes que abandonen o retomen la consulta).
- Generador de Documentación Médica (Con Código QR): Creación automatizada en formato PDF de recetas (récipes), órdenes de exámenes de laboratorio, estudios de imagenología y constancias médicas. Cada documento incluirá un Código QR criptográfico que, al ser escaneado por farmacias o laboratorios, validará la autenticidad del documento emitido por el sistema.
- Tablero de Estadísticas (Cohortes): Gráficas avanzadas generadas a partir de la data levantada (laboratorios, evolución de peso y composición corporal). El médico podrá ver el progreso consolidado de sus pacientes activos.
- Exportación de Datos: Opción para exportar la data clínica generada al formato estructurado antiguo de los 3 archivos de Excel, asegurando retrocompatibilidad total si el médico necesita un respaldo físico.

### **3.3. Módulo del Paciente (Herramienta de Adherencia y Retención)**

Un espacio privado donde el paciente se vuelve co-creador de su tratamiento, incrementando la motivación para regresar a consulta.

- Constructor de Menús Interactivo: En base a los parámetros y raciones definidos por el médico, el paciente accederá a un panel donde podrá "armar" sus comidas diarias. El sistema restringirá las opciones asegurando que no sobrepasen las raciones permitidas.
- Panel de Carga de Evolución: El paciente podrá subir por su cuenta ciertas variables de control periódicamente (peso, medidas corporales), alimentando el sistema antes de la próxima consulta.
- Dashboard Estadístico Personal: Gráficas visuales y amigables donde el paciente verá su propia evolución y cercanía a las metas establecidas por el médico.
- Repositorio de Documentos Médicos: Un "cajón digital" donde el paciente podrá visualizar y descargar todos los récipes, planes de alimentación, órdenes de laboratorio e imagenología generados por el Dr. Porras en la consulta.
- Perfil y Agendamiento: Panel para actualizar datos personales, cambiar contraseñas y un recordatorio destacado de la fecha de su Próxima Consulta.

### **3.4. Módulo de Secretaría (Gestión Operativa y Migración)**

Perfil de apoyo administrativo diseñado específicamente para la transición digital sin sobrecargar al médico.

- Carga Masiva (Bulk Upload) de Pacientes Antiguos: La secretaria tendrá acceso a una interfaz donde podrá subir los archivos históricos ("Historia Adultos", "Recomendaciones", "Plan Modelo"). El sistema leerá estos archivos de Excel y creará de forma automática el perfil base del paciente antiguo en la base de datos.
- Gestión de Estados: Tras la digitalización, estos perfiles quedarán en estado "Inactivo" hasta que el paciente asista a una nueva consulta de control, momento en el cual el médico o la secretaria podrán reactivarlos.

## **4\. Especificaciones Técnicas y Stack de Desarrollo**

---

El ecosistema digital se construye empleando tecnologías de alta gama que aseguran un rendimiento óptimo y un entorno blindado para datos de salud sensibles.

| Capa de Software            | Tecnología Seleccionada                 | Justificación Técnica                                                                                                                             |
| :-------------------------- | :-------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| Backend (Lógica y Servidor) | Django \+ DRF (Python)                  | Seguridad nativa (encriptación), manejo robusto de lógica matemática avanzada (conversión calórica) y generación eficiente de PDF con Códigos QR. |
| Frontend (Interfaz WebApp)  | React.js \+ Vite \+ Tailwind CSS \+ Bun | Interfaz responsiva que se adapta perfectamente a pantallas de celulares, tabletas y PC con tiempos de carga ultrarrápidos.                       |
| Base de Datos               | SQLite (Dev) → PostgreSQL (Prod)        | Motor relacional robusto en producción para asegurar la integridad de las historias clínicas con respaldos automáticos.                           |
| Sistema de Autenticación    | Sessions (Dev) → JWT (Futuro/Prod)      | Mecanismo de transmisión de identidad seguro (JSON Web Tokens), ideal para mantener sesiones protegidas.                                          |

##

## **5\. Cronograma de Ejecución y Roadmap (Fases de Desarrollo)**

---

El desarrollo del proyecto se ejecuta bajo una metodología ágil estructurada en tres meses de trabajo continuo, iniciando en mayo de 2026 y proyectando el despliegue final para finales de julio de 2026:

- **Fase 1:** Conceptualización y Mockups (Mayo 2026\) \- _Completada_
  - Diseño de la arquitectura de la base de datos e interfaces de usuario preliminares.
  - Presentación de prototipos visuales al Dr. Porras con retroalimentación y aprobaciones satisfactorias.
- **Fase 2:** Ingeniería de Backend e Integración de Datos (Junio 2026\) \- _Fase Actual_
  - Construcción de la lógica del servidor en Django y endpoints de la API.
  - Desarrollo del algoritmo de conversión calórica y bases de datos para las Listas de Intercambio.
  - Desarrollo de la landing page del profesional médico.
  - Implementación del módulo de secretaría y el parser para la extracción automática de datos desde archivos Excel legacy.
  - Desarrollo del motor de generación de Récipes, Constancias y Órdenes Médicas con integración de validación criptográfica vía Código QR.
- **Fase 3:** Frontend, Pruebas y Despliegue Cloud (Julio 2026\) \- _Próxima Fase_
  - Construcción de las pantallas interactivas en React (Dashboard de paciente, repositorio de documentos y constructor de menús).
  - Integración del motor de reportes analíticos y exportación a formatos PDF/Excel.
  - Pruebas de seguridad, carga y despliegue del ecosistema en el servidor de producción cloud para finales de julio de 2026\.

## **6\. Funcionalidades Planteadas Pendientes de Desarrollo**

---

A continuación se listan las funcionalidades definidas en la propuesta original que aún no han sido implementadas en el sistema, organizadas por módulo y ordenadas por prioridad de ejecución:

### **6.1. Portal Público y Landing Page**

- **Landing Page Pública del Dr. Porras:** No existe ninguna página de acceso público. El sistema actualmente inicia directamente en el formulario de login. Pendiente construir la sección de perfil profesional, especialidad, galería de fotos (antes/después) e identidad corporativa.
- **Módulo Multimedia y Redes:** Falta integrar reproductores de video (enlace a entrevistas en YouTube) y widgets de autoridad profesional en la landing pública.
- **Botones Flotantes de Contacto:** No se han implementado los botones de contacto rápido por WhatsApp ni los enlaces a redes sociales.
- **Calculadora IMC Pública (Lead Magnet):** No existe una calculadora de Índice de Masa Corporal accesible sin autenticación. Debe incluir llamado a la acción (CTA) para agendar cita según el riesgo detectado.

### **6.2. Módulo del Médico**

- **Generador de Documentación Médica con PDF y Código QR Criptográfico:** Es la funcionalidad de mayor criticidad pendiente. No existe ningún endpoint ni lógica para la creación automatizada de récipes, órdenes de exámenes de laboratorio, estudios de imagenología ni constancias médicas en formato PDF. Tampoco se ha implementado el Código QR de validación criptográfica que permita a farmacias y laboratorios verificar la autenticidad de los documentos emitidos por el sistema.

### **6.3. Módulo del Paciente**

- **Constructor de Menús Interactivo:** La vista `PlannerView` existe en el frontend pero el paciente no dispone de una interfaz funcional para "armar" sus comidas diarias dentro de los límites de raciones definidos por el médico. Falta desarrollar la lógica de restricción que impida al paciente sobrepasar las porciones asignadas.
- **Repositorio de Documentos Médicos:** No existe ningún modelo ni interfaz para que el paciente visualice y descargue los documentos generados en consulta (récipes, planes de alimentación en PDF, órdenes de laboratorio). Esta funcionalidad depende directamente del Generador de Documentación Médica.
- **Recordatorio de Próxima Consulta:** El perfil del paciente no cuenta con un campo ni visualización destacada de la fecha de su próxima cita. El sistema de notificaciones está implementado pero no contempla este caso específico.

---

# algunos cambios necesarios

- eliminar la logica de plantilla en los planes alimenticios.
- agregar URL en los enviroments par que se use en los documentos generados.
- agregar una logica de "cache", con zustand para minimizar la cantidad de peticiones al servidor.
