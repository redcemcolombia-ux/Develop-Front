import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { GestionarControlUsoService, HistorialRegistro } from './gestionar-control-uso.service';
import { Usuario } from '../listadoUsuarios/listado-usuarios.service';

@Component({
  selector: 'app-gestionar-control-uso',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './gestionar-control-uso.html',
  styleUrls: ['./gestionar-control-uso.css']
})
export class GestionarControlUso implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(GestionarControlUsoService);

  @Input() usuario: Usuario | null = null;
  @Output() volverListado = new EventEmitter<void>();

  form!: FormGroup;
  isLoading = false;
  isLoadingHistorial = false;
  historial: HistorialRegistro[] = [];

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarHistorial();
  }

  inicializarFormulario(): void {
    this.form = this.fb.group({
      co_cantidad: [0, [Validators.required, Validators.min(1), Validators.pattern('^[0-9]*$')]]
    });
  }

  volver(): void {
    this.volverListado.emit();
  }

  guardar(): void {
    if (this.form.invalid) {
      Swal.fire({
        title: 'Formulario Inválido',
        text: 'Por favor ingrese una cantidad válida (mínimo 1)',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    if (!this.usuario?._id) {
      Swal.fire({
        title: 'Error',
        text: 'No se puede identificar el usuario',
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const cantidad = this.form.get('co_cantidad')?.value;

    Swal.fire({
      title: '¿Confirmar acción?',
      text: `Se asignarán ${cantidad} casos al usuario ${this.usuario.Cr_Nombre_Usuario}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.ejecutarGuardado();
      }
    });
  }

  private ejecutarGuardado(): void {
    this.isLoading = true;
    const cantidad = this.form.get('co_cantidad')?.value;

    this.service.gestionarControlUso(this.usuario!._id, cantidad).subscribe({
      next: (resp) => {
        this.isLoading = false;
        if (resp.error === 0) {
          Swal.fire({
            title: '¡Éxito!',
            text: resp.response?.mensaje || 'Registro gestionado exitosamente',
            icon: 'success',
            confirmButtonText: 'Entendido'
          }).then(() => {
            this.cargarHistorial();
            this.form.reset({ co_cantidad: 0 });
          });
        } else {
          Swal.fire({
            title: 'Información',
            text: resp.response?.mensaje || 'No se pudo gestionar el registro',
            icon: 'info',
            confirmButtonText: 'Entendido'
          });
        }
      },
      error: (err) => {
        this.isLoading = false;
        const mensaje = err.error?.response?.mensaje || 'Error al procesar la solicitud';
        Swal.fire({
          title: 'Error',
          text: mensaje,
          icon: 'error',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  cargarHistorial(): void {
    if (!this.usuario?._id) return;

    this.isLoadingHistorial = true;
    this.service.obtenerHistorial(this.usuario._id).subscribe({
      next: (resp) => {
        this.isLoadingHistorial = false;
        if (resp.error === 0 && resp.response?.registros) {
          this.historial = resp.response.registros;
        } else {
          this.historial = [];
        }
      },
      error: () => {
        this.isLoadingHistorial = false;
        this.historial = [];
      }
    });
  }
}
