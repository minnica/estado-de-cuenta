import { LitElement, html } from 'lit';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import '../node_modules/bootstrap/dist/js/bootstrap.bundle.min.js';


export class MainView extends LitElement {
  createRenderRoot() {
    return this;
  }

  static properties = {
    data: {
      type: Object
    },
    error: {
      type: String
    },
    formData: {
      type: Object
    },
    responseMessage: {
      type: String
    },
    modalVisible: {
      type: Boolean
    },
  };

  constructor() {
    super();
    this.data = [];
    this.error = '';
    this.formData = {
      categoria: '',
      movimiento: '',
      monto: 0,
      msi: 1,
      persona: '',
    };
    this.responseMessage = '';
    this.modalVisible = false;

  }

  connectedCallback() {
    super.connectedCallback();
    this._fetchData();
  }

  async _fetchData() {
    try {
      const response = await fetch('http://localhost:8000/estadoCuenta');
      if (!response.ok) {
        throw new Error('Error en la respuesta de la API');
      }
      const result = await response.json();
      this.data = result;
    } catch (error) {
      this.error = error.message;
    }
  }

  async _sendPostRequest() {
    try {
      console.log("🚀 ~ MainView ~ _sendPostRequest ~ JSON.stringify(this.formData):", JSON.stringify(this.formData))
      const response = await fetch('http://localhost:8000/estadoCuenta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.formData),
      });

      if (!response.ok) {
        throw new Error('Error en la solicitud');
      }

      const result = await response.json();
      this.responseMessage = `Solicitud exitosa: ${result.message}`;
      this._closeModal();
      this._fetchData();
    } catch (error) {
      this.responseMessage = `Error: ${error.message}`;
    }
  }

  _handleInputChange(e) {
    const { name, value, type } = e.target;
    this.formData = {
      ...this.formData,
      [name]: type === 'number' ? Number(value) : value,
    };
  }

  get _tplTable() {
    return html`
      <table class="table table-bordered">
        <thead class="table-dark">
          <th>CATEGORIA</th>
          <th>MOVIMIENTOS</th>
          <th>MONTO</th>
          <th>MSI</th>
          <th>PARCIALIDAD</th>
          <th>MES RESTANTE</th>
          <th>PAGO</th>
          <th>PAGO RESTANTE</th>
          <th>PERSONA</th>
          <th>ACCIONES</th>
        </thead>
        <tbody>
          ${this.data.map(
            (item) => html`
              <tr>
                <td>${item.categoria}</td>
                <td>${item.movimiento}</td>
                <td>${item.monto}</td>
                <td>${item.msi}</td>
                <td>${item.parcialidad}</td>
                <td>${item.mes_restante}</td>
                <td>${item.pago}</td>
                <td>${item.pago_restante}</td>
                <td>${item.persona}</td>
                <td><button class="btn btn-primary">Editar</button><button class="btn btn-danger">Borrar</button></td>
              </tr>
            `
          )}
        </tbody>
      </table>
    `;
  }

  _openModal() {
    this.modalVisible = true;
    const modal = new bootstrap.Modal(this.renderRoot.querySelector('#exampleModal'));
    modal.show();
  }

  _closeModal() {
    const modal = bootstrap.Modal.getInstance(this.renderRoot.querySelector('#exampleModal'));
    modal.hide();
  }

  get tplButtonModal() {
    return html`
    <div class="d-flex justify-content-center mb-3">
      <button class="btn btn-info" @click="${this._openModal}">CREAR</button>
    </div>
    <div class="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h1 class="modal-title fs-5" id="exampleModalLabel">Modal title</h1>
            <button type="button" class="btn-close" aria-label="Close" @click="${this._closeModal}"></button>
          </div>
          <form @submit="${(e) => e.preventDefault()}">
            <div class="modal-body">
              <div class="row">
                <div class="col-sm-6 mb-3">
                <select
                  class="form-select"
                  aria-label="Categoria"
                  name="categoria"
                  .value="${this.formData.categoria}"
                  @change="${this._handleInputChange}"
                >
                  <option value="" disabled selected>Seleccionar</option>
                  <option value="Entretenimiento">Entretenimiento</option>
                  <option value="Comida">Comida</option>
                </select>

                </div>
                <div class="col-sm-6 mb-3">
                  <input
                    type="text"
                    class="form-control"
                    name="movimiento"
                    placeholder="Movimiento"
                    .value="${this.formData.movimiento}"
                    @input="${this._handleInputChange}"
                  >
                </div>
              </div>
              <div class="row">
                <div class="col-sm-6 mb-3">
                  <input
                    type="number"
                    class="form-control"
                    name="monto"
                    placeholder="Monto"
                    .value="${String(this.formData.monto)}"
                    @input="${this._handleInputChange}"
                  >
                </div>
                <div class="col-sm-6 mb-3">
                  <input
                    type="number"
                    class="form-control"
                    name="msi"
                    placeholder="MSI"
                    .value="${String(this.formData.msi)}"
                    @input="${this._handleInputChange}"
                  >
                </div>
              </div>
              <div class="row">
                <div class="col-sm-6 mb-3">
                  <input
                    type="text"
                    class="form-control"
                    name="persona"
                    placeholder="Persona"
                    .value="${this.formData.persona}"
                    @input="${this._handleInputChange}"
                  >
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="${this._closeModal}">Cerrar</button>
              <button type="button" class="btn btn-primary" @click="${this._sendPostRequest}">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
    `;
  }

  render() {
    return html`
      <div class="container mt-3">
        ${this.tplButtonModal}
        ${this._tplTable}
      </div>
    `;
  }
}

customElements.define('main-view', MainView);
