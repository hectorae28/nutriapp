"""
Management command para desactivar pacientes inactivos.

Uso:
    python manage.py desactivar_pacientes
    
Opciones:
    --dry-run: muestra qué pacientes se desactivarían sin modificar la BD
    --dias N: override del valor de configuración
"""
from datetime import date, timedelta

from django.core.management.base import BaseCommand
from apps.users.models import ConfiguracionSistema, Paciente
from apps.expediente.models import ExpedienteClinico


class Command(BaseCommand):
    help = 'Desactiva pacientes inactivos según configuración del sistema'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Muestra qué pacientes se desactivarían sin modificar la BD',
        )
        parser.add_argument(
            '--dias',
            type=int,
            help='Días de inactividad (override del valor en BD)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        dias_override = options.get('dias')
        
        # Obtener días de inactividad de configuración
        if dias_override:
            dias_inactividad = dias_override
        else:
            dias_str = ConfiguracionSistema.get('dias_inactividad_desactivar', '180')
            try:
                dias_inactividad = int(dias_str)
            except ValueError:
                self.stdout.write(
                    self.style.ERROR(
                        f"Valor inválido en configuración: '{dias_str}'. Usando 180 días por defecto."
                    )
                )
                dias_inactividad = 180
        
        fecha_limite = date.today() - timedelta(days=dias_inactividad)
        
        self.stdout.write(
            self.style.WARNING(
                f"\nBuscando pacientes inactivos desde antes de {fecha_limite} "
                f"({dias_inactividad} días)...\n"
            )
        )
        
        # Obtener pacientes activos
        pacientes_activos = Paciente.objects.filter(
            user__is_active=True
        ).select_related('user')
        
        pacientes_a_desactivar = []
        
        for paciente in pacientes_activos:
            # Obtener última actividad del expediente o registros de progreso
            ultima_actividad = None
            
            # Verificar expediente (usar updated_at como actividad)
            try:
                expediente = ExpedienteClinico.objects.get(paciente=paciente)
                if hasattr(expediente, 'updated_at') and expediente.updated_at:
                    ultima_actividad = expediente.updated_at.date()
            except ExpedienteClinico.DoesNotExist:
                pass
            
            # Verificar registros de progreso (más reciente)
            ultimo_registro = paciente.registros_progreso.order_by('-fecha').first()
            if ultimo_registro:
                if not ultima_actividad or ultimo_registro.fecha > ultima_actividad:
                    ultima_actividad = ultimo_registro.fecha
            
            # Verificar planes alimenticios (última fecha de inicio)
            ultimo_plan = paciente.planes.order_by('-fecha_inicio').first()
            if ultimo_plan:
                if not ultima_actividad or ultimo_plan.fecha_inicio > ultima_actividad:
                    ultima_actividad = ultimo_plan.fecha_inicio
            
            # Si no hay actividad registrada, usar fecha de creación del paciente
            if not ultima_actividad:
                # Usar created_at del paciente como fallback
                if hasattr(paciente, 'created_at') and paciente.created_at:
                    ultima_actividad = paciente.created_at.date()
                elif hasattr(paciente.user, 'date_joined'):
                    ultima_actividad = paciente.user.date_joined.date()
            
            # Si sigue sin actividad, skip
            if not ultima_actividad:
                continue
            
            # Verificar si debe desactivarse
            if ultima_actividad < fecha_limite:
                pacientes_a_desactivar.append((paciente, ultima_actividad))
        
        if not pacientes_a_desactivar:
            self.stdout.write(
                self.style.SUCCESS('\n✓ No hay pacientes para desactivar.\n')
            )
            return
        
        # Mostrar pacientes a desactivar
        self.stdout.write(
            self.style.WARNING(
                f"\nSe desactivarán {len(pacientes_a_desactivar)} paciente(s):\n"
            )
        )
        
        for paciente, ultima_actividad in pacientes_a_desactivar:
            dias_inactivo = (date.today() - ultima_actividad).days
            self.stdout.write(
                f"  • {paciente.user.get_full_name() or paciente.user.username} "
                f"(Cédula: {paciente.cedula}) - "
                f"Última actividad: {ultima_actividad} ({dias_inactivo} días)"
            )
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    '\n⚠ Modo --dry-run: no se modificó la base de datos.\n'
                )
            )
            return
        
        # Desactivar pacientes
        count = 0
        for paciente, _ in pacientes_a_desactivar:
            paciente.user.is_active = False
            paciente.user.save(update_fields=['is_active'])
            count += 1
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\n✓ {count} paciente(s) desactivado(s) exitosamente.\n'
            )
        )
