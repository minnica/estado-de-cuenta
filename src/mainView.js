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
    currentPage: {
      type: Number
    },
    rowsPerPage: {
      type: Number
    },
    editingId: {
      type: Number
    },
  };

  constructor() {
    super();
    this.data = [];
    this.error = '';
    this.formData = {
      categoria: '',
      movimiento: '',
      monto: null,
      msi: null,
      persona: '',
      parcialidad: null,
      mes_restante: null,
      pago: null,
      pago_restante: null
    };
    this.responseMessage = '';
    this.modalVisible = false;
    this.currentPage = 1;
    this.rowsPerPage = 10;
    this.editingId = null;
  }

  _changePage(pageNumber) {
    this.currentPage = pageNumber;
  }

  get _paginatedData() {
    const start = (this.currentPage - 1) * this.rowsPerPage;
    const end = start + this.rowsPerPage;
    return this.data.slice(start, end);
  }

  get _paginationButtons() {
    const totalPages = Math.ceil(this.data.length / this.rowsPerPage);
    let buttons = [];
    for (let i = 1; i <= totalPages; i++) {
      buttons.push(html`<button class="btn btn-secondary mx-1" @click="${() => this._changePage(i)}">${i}</button>`);
    }
    return buttons;
  }

  connectedCallback() {
    super.connectedCallback();
    this._getRecords();
  }

  async _getRecords() {
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

  async _editRecord(id) {
    try {
      const response = await fetch(`http://localhost:8000/estadoCuenta/${id}`);
      if (!response.ok) {
        throw new Error('Error al obtener los datos del registro');
      }
      const record = await response.json();
      this.formData = {
        categoria: record.categoria,
        movimiento: record.movimiento,
        monto: record.monto,
        msi: record.msi,
        persona: record.persona,
        parcialidad: record.parcialidad,
        mes_restante: record.mes_restante,
        pago: record.pago,
        pago_restante: record.pago_restante
      };
      this.editingId = id;
      this._openModal();
    } catch (error) {
      console.error('Error al editar el registro:', error.message);
    }
  }

  async _saveRecord() {
    try {
      let url = 'http://localhost:8000/estadoCuenta';
      let method = 'POST';
      if (this.editingId !== null) {
        url = `http://localhost:8000/estadoCuenta/${this.editingId}`;
        method = 'PUT';
      }
      const response = await fetch(url, {
        method: method,
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
      this._getRecords();
      this.editingId = null;
    } catch (error) {
      this.responseMessage = `Error: ${error.message}`;
    }
  }

  async _deleteRecord(id) {
    try {
      const response = await fetch(`http://localhost:8000/estadoCuenta/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el registro');
      }

      const result = await response.json();
      this.responseMessage = `Registro eliminado: ${result.message}`;
      this._getRecords();
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

  _onChangeValue(e){
    const { value } = e.target
    if (value !== 1) {
      this.formData.mes_restante = this.formData.msi - value
      this.formData.pago = (this.formData.monto/this.formData.msi).toFixed(2)
      this.formData.pago_restante = ((this.formData.monto/this.formData.msi) * this.formData.mes_restante).toFixed(2)
    }
    this.requestUpdate();
  }

  get _tplTable() {
    return html`
      <table class="table table-bordered">
        <thead class="table-dark">
          <th>ID</th>
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
          ${this._paginatedData.map(
            (item) => html`
              <tr>
                <td>${item.id}</td>
                <td>${item.categoria}</td>
                <td>${item.movimiento}</td>
                <td>${item.monto}</td>
                <td>${item.msi}</td>
                <td>${item.parcialidad}</td>
                <td>${item.mes_restante}</td>
                <td>${item.pago}</td>
                <td>${item.pago_restante}</td>
                <td>${item.persona}</td>
                <td>
                  <div class="btn-group" role="group" aria-label="Basic mixed styles example">
                    <button type="button" class="btn btn-primary btn-sm" @click="${() => this._editRecord(item.id)}">Editar</button>
                    <button type="button" class="btn btn-danger btn-sm" @click="${() => this._deleteRecord(item.id)}">Borrar</button>
                  </div>
                </td>
              </tr>
            `
            )}
        </tbody>
      </table>
      <div class="d-flex justify-content-center mt-3">
        ${this._paginationButtons}
      </div>
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
    this.formData = {
      categoria: '',
      movimiento: '',
      monto: null,
      msi: null,
      persona: '',
      parcialidad: null,
      mes_restante: null,
      pago: null,
      pago_restante: null
    };
    this.editingId = null;
  }

  _createRecord() {
    this.formData = {
      categoria: '',
      movimiento: '',
      monto: null,
      msi: null,
      persona: '',
      parcialidad: null,
      mes_restante: null,
      pago: null,
      pago_restante: null
    };
    this.editingId = null;
    this._openModal()
  }

  get _tplButtonModal() {
    return html`
    <div class="d-flex justify-content-center mb-3">
      <button class="btn btn-info" @click="${this._createRecord}">CREAR</button>
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
                  <option value="Chatarra">Chatarra</option>
                  <option value="Mobiliario">Mobiliario</option>
                  <option value="Electrónica">Electrónica</option>
                  <option value="Electrodomésticos">Electrodomésticos</option>
                  <option value="Ropa">Ropa</option>
                  <option value="Herramientas">Herramientas</option>
                  <option value="Hogar">Hogar</option>
                  <option value="Oficina">Oficina</option>
                  <option value="Accesorio">Accesorio</option>
                  <option value="Otros">Otros</option>
                </select>

                </div>
                <div class="col-sm-6 mb-3">
                  <input
                    type="text"
                    class="form-control"
                    name="movimiento"
                    placeholder="MOVIMIENTO"
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
                    placeholder="MONTO"
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
                    type="number"
                    class="form-control"
                    name="parcialidad"
                    placeholder="PARCIALIDAD"
                    .value="${String(this.formData.parcialidad)}"
                    @input="${(e) => { this._onChangeValue(e); this._handleInputChange(e); }}"
                  >
                </div>
                <div class="col-sm-6 mb-3">
                  <input
                    type="number"
                    class="form-control"
                    name="mes_restante"
                    placeholder="MES RESTANTE"
                    .value="${String(this.formData.mes_restante)}"
                    @input="${this._handleInputChange}"
                    disabled
                  >
                </div>
              </div>
              <div class="row">
                <div class="col-sm-6 mb-3">
                  <input
                    type="number"
                    class="form-control"
                    name="pago"
                    placeholder="PAGO"
                    .value="${String(this.formData.pago)}"
                    @input="${this._handleInputChange}"
                    disabled
                  >
                </div>
                <div class="col-sm-6 mb-3">
                  <input
                    type="number"
                    class="form-control"
                    name="pago_restante"
                    placeholder="PAGO RESTANTE"
                    .value="${String(this.formData.pago_restante)}"
                    @input="${this._handleInputChange}"
                    disabled
                  >
                </div>
              </div>
              <div class="row">
                <div class="col-sm-12 mb-3">
                  <input
                    type="text"
                    class="form-control"
                    name="persona"
                    placeholder="PERSONA"
                    .value="${this.formData.persona}"
                    @input="${this._handleInputChange}"
                  >
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="${this._closeModal}">Cerrar</button>
              <button type="button" class="btn btn-primary" @click="${this._saveRecord}">Guardar</button>
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
        ${this._tplButtonModal}
        ${this._tplTable}
      </div>
    `;
  }
}

customElements.define('main-view', MainView);
