import { Component, OnInit, inject, Input, Output, EventEmitter, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { EditarUsuarioService } from './editar-usuario.service';
import { Usuario } from '../listadoUsuarios/listado-usuarios.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-editar-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './editar-usuario.html',
  styleUrl: './editar-usuario.css',
  encapsulation: ViewEncapsulation.None
})
export class EditarUsuario implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly editarService = inject(EditarUsuarioService);

  @Input() usuario: Usuario | null = null;
  @Output() volverListado = new EventEmitter<void>();

  submitted = false;
  cargandoIps = false;

  tiposDocumento = ['CC', 'CE', 'TI', 'PA'];
  perfiles = ['Administrador', 'Supervisor', 'Usuario', 'Cliente', 'Cliente Gestor', 'Cliente Admin', 'Cliente Informes', 'Psicólogo-Supervisor', 'Psicólogo'];
  ips: any[] = [];

  readonly form = this.fb.group({
    peNombre: ['', [Validators.required, Validators.maxLength(50)]],
    peApellido: ['', [Validators.required, Validators.maxLength(50)]],
    peSegApellido: ['', [Validators.maxLength(50)]],
    peTipoDocumento: ['CC', [Validators.required]],
    peDocumento: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9\-\.]+$/)]],
    peTelefonoFijo: ['', [Validators.required, Validators.pattern(/^\d{7,12}$/)]],
    peCel: ['', [Validators.required, Validators.pattern(/^\d{7,12}$/)]],
    peCorreo: ['', [Validators.required, Validators.email]],
    peDireccion: ['', [Validators.required, Validators.maxLength(120)]],
    pePermiso: ['Lectura y Escritura', [Validators.required]],
    peDepartamento: ['', [Validators.required]],
    peCiudad: ['', [Validators.required]],

    crNombreUsuario: ['', [Validators.required, Validators.email]],
    crPerfil: ['Administrador', [Validators.required]],
    crEmpresa: [''],
    crEstado: ['Activo', [Validators.required]]
  });

  ngOnInit(): void {
    this.cargarIps();
    if (this.usuario) {
      this.cargarDatosUsuario();
    }
  }

  cargarDatosUsuario(): void {
    if (!this.usuario) return;

    const persona = this.usuario.Cr_Pe_Codigo;

    this.form.patchValue({
      peNombre: persona.Pe_Nombre || '',
      peApellido: persona.Pe_Apellido || '',
      peSegApellido: persona.Pe_Seg_Apellido || '',
      peTipoDocumento: persona.Pe_Tipo_Documento || 'CC',
      peDocumento: persona.Pe_Documento || '',
      peTelefonoFijo: persona.Pe_Telefons_Fijo || '',
      peCel: persona.Pe_Cel || '',
      peCorreo: persona.Pe_Correo || '',
      peDireccion: persona.Pe_Direccion || '',
      pePermiso: persona.Pe_Permiso || 'Lectura y Escritura',
      peDepartamento: persona.Pe_Departamento || '',
      peCiudad: persona.Pe_Ciudad || '',

      crNombreUsuario: this.usuario.Cr_Nombre_Usuario || '',
      crPerfil: this.usuario.Cr_Perfil || 'Administrador',
      crEmpresa: this.usuario.Cr_Ips?._id || this.usuario.Cr_Empresa || '',
      crEstado: this.usuario.Cr_Estado || 'Activo'
    });
  }

  cargarIps(): void {
    this.cargandoIps = true;
    this.editarService.consultarIps().subscribe({
      next: (response) => {
        this.cargandoIps = false;
        if (response?.error === 0 && response?.response?.ips) {
          this.ips = response.response.ips;
        } else {
          Swal.fire({
            icon: 'warning',
            title: 'Advertencia',
            text: 'No se pudieron cargar las IPS disponibles'
          });
        }
      },
      error: () => {
        this.cargandoIps = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al cargar las IPS disponibles'
        });
      }
    });
  }

  get f() { return this.form.controls; }

  submit(): void {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, complete todos los campos obligatorios correctamente'
      });
      return;
    }

    if (!this.usuario?._id) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo identificar el usuario a actualizar'
      });
      return;
    }

    const payload = {
      id: this.usuario._id,
      persona: {
        Pe_Nombre: this.f.peNombre.value,
        Pe_Apellido: this.f.peApellido.value,
        Pe_Seg_Apellido: this.f.peSegApellido.value,
        Pe_Tipo_Documento: this.f.peTipoDocumento.value,
        Pe_Documento: this.f.peDocumento.value,
        Pe_Telefons_Fijo: this.f.peTelefonoFijo.value,
        Pe_Cel: this.f.peCel.value,
        Pe_Correo: this.f.peCorreo.value,
        Pe_Direccion: this.f.peDireccion.value,
        Pe_Permiso: this.f.pePermiso.value,
        Pe_Departamento: this.f.peDepartamento.value,
        Pe_Ciudad: this.f.peCiudad.value
      },
      credenciales: {
        Cr_Nombre_Usuario: this.f.crNombreUsuario.value,
        Cr_Perfil: this.f.crPerfil.value,
        Cr_Empresa: this.f.crEmpresa.value,
        Cr_Estado: this.f.crEstado.value
      }
    };

    this.editarService.actualizarUsuario(payload).subscribe({
      next: (res) => {
        if (res?.error === 1) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: res?.response?.mensaje ?? 'Error al actualizar'
          });
          return;
        }

        if (res?.error === 0) {
          Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: res?.response?.mensaje ?? 'Usuario actualizado exitosamente'
          }).then(() => {
            this.volverAlListado();
          });
        }
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err?.error?.response?.mensaje ?? 'Error al actualizar el usuario'
        });
      }
    });
  }

  volverAlListado(): void {
    this.volverListado.emit();
  }

  cancelar(): void {
    Swal.fire({
      title: '¿Cancelar edición?',
      text: 'Los cambios no guardados se perderán',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No, continuar editando'
    }).then((result) => {
      if (result.isConfirmed) {
        this.volverAlListado();
      }
    });
  }
}
