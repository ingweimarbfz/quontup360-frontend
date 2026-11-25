import React, { useEffect, useState } from 'react'
import api, { errorMessage } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { Field, Modal, Spinner } from '../../components/ui'
import { MdReceiptLong } from 'react-icons/md'
import { DocIcon, LocationButton, MoneyInput, PhotoInput } from '../../components/forms'
import { CUSTOMER_STATUS } from '../../utils/credit'
import { DocTypeSelect } from '../../utils/docTypes'
import { phoneProps } from '../../utils/phones'

const EMPTY = {
  docType: '', identification: '', name: '', lastName: '', phone: '', phone2: '', email: '', address: '', neighborhood: '', city: '',
  occupation: '', businessAddress: '', birthDate: '', photoUrl: null, photoThumb: null, idPhotoUrl: null, idPhotoBackUrl: null, utilityBillUrl: null, lat: null, lng: null,
  lenderId: '', creditLimit: '', status: 'activo', notes: ''
}

// Alta y edición de clientes. La foto de la persona es obligatoria.
const CustomerForm = ({ initial, onClose, onSaved }) => {
  const { user } = useAuth()
  const admin = user.role === 'administrador'
  const editing = Boolean(initial?.id)
  const [form, setForm] = useState(() => ({ ...EMPTY, ...(initial || {}), lenderId: initial?.lenderId || '', creditLimit: initial?.creditLimit ?? '' }))
  const [lenders, setLenders] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  useEffect(() => { if (admin) api.get('/prestamistas').then(({ data }) => setLenders(data)).catch(() => {}) }, [admin])
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.photoUrl) { setError('Toma o sube la foto del cliente: es obligatoria.'); return }
    if (!form.idPhotoUrl || !form.idPhotoBackUrl) { setError(`Toma la foto del documento ${!form.idPhotoUrl && !form.idPhotoBackUrl ? 'por ambas caras (delantera y trasera)' : !form.idPhotoUrl ? '(parte delantera)' : '(parte trasera)'}: es obligatoria.`); return }
    setSaving(true)
    try {
      const { data } = editing ? await api.put(`/clientes/${initial.id}`, form) : await api.post('/clientes', form)
      onSaved(data, editing)
    } catch (err) { setError(errorMessage(err)) } finally { setSaving(false) }
  }

  return (
    <Modal size="lg" title={editing ? 'Editar cliente' : 'Nuevo cliente'} onClose={onClose}
      footer={<><button type="button" className="btn" onClick={onClose}>Cancelar</button><button type="submit" form="customer-form" className="btn btn-primary" disabled={saving}>{saving && <Spinner />} Guardar cliente</button></>}>
      <form id="customer-form" className="form-grid" onSubmit={submit} noValidate>
        <div className="section-title">Foto</div>
        <div className="span-2 photo-row">
          <Field label="Foto de la persona" required>
            <PhotoInput value={form.photoUrl} withThumb avatars capture="user" label="Tomar foto" onChange={({ photo, thumb }) => setForm((f) => ({ ...f, photoUrl: photo, photoThumb: thumb }))} />
          </Field>
          <Field label="Documento · parte delantera" required>
            <PhotoInput doc value={form.idPhotoUrl} label="Delantera" placeholder={<DocIcon side="front" />} onChange={(v) => setForm((f) => ({ ...f, idPhotoUrl: v }))} />
          </Field>
          <Field label="Documento · parte trasera" required>
            <PhotoInput doc value={form.idPhotoBackUrl} label="Trasera" placeholder={<DocIcon side="back" />} onChange={(v) => setForm((f) => ({ ...f, idPhotoBackUrl: v }))} />
          </Field>
        </div>
        <div className="span-2 photo-row">
          <Field label="Recibo de servicios públicos" hint="Opcional. Agua, luz o gas a nombre del hogar: ayuda a comprobar la dirección.">
            <PhotoInput doc value={form.utilityBillUrl} label="Recibo" placeholder={<MdReceiptLong size={34} />} onChange={(v) => setForm((f) => ({ ...f, utilityBillUrl: v }))} />
          </Field>
        </div>
        <p className="span-2 hint" style={{ margin: '-6px 0 0' }}>En el celular se abre la cámara trasera para fotografiar el documento. Procura buena luz y que se lean los datos.</p>

        <div className="section-title">Datos personales</div>
        <Field label="Tipo de documento" htmlFor="docType">
          <DocTypeSelect id="docType" value={form.docType} onChange={set('docType')} />
        </Field>
        <Field label="Número de documento" htmlFor="ident" required><input id="ident" minLength={5} maxLength={15} value={form.identification} onChange={set('identification')} inputMode="numeric" /></Field>
        <Field label="Nombres" htmlFor="cname" required><input id="cname" data-only="letters" value={form.name} onChange={set('name')} /></Field>
        <Field label="Apellidos" htmlFor="clast"><input id="clast" data-only="letters" value={form.lastName} onChange={set('lastName')} /></Field>
        <Field label="Celular" htmlFor="cphone" required><input {...phoneProps()} id="cphone" value={form.phone || ''} onChange={set('phone')} /></Field>
        <Field label="Teléfono 2" htmlFor="cphone2"><input {...phoneProps()} id="cphone2" value={form.phone2 || ''} onChange={set('phone2')} /></Field>
        <Field label="Correo" htmlFor="cemail"><input id="cemail" type="email" value={form.email || ''} onChange={set('email')} /></Field>
        <Field label="Fecha de nacimiento" htmlFor="cbirth"><input id="cbirth" type="date" value={form.birthDate || ''} onChange={set('birthDate')} /></Field>

        <div className="section-title">Ubicación y actividad</div>
        <Field label="Dirección de residencia" htmlFor="caddr" required><input id="caddr" value={form.address || ''} onChange={set('address')} placeholder="Calle 45 # 12-30" /></Field>
        <Field label="Barrio" htmlFor="cnb"><input id="cnb" value={form.neighborhood || ''} onChange={set('neighborhood')} /></Field>
        <Field label="Ciudad" htmlFor="ccity"><input id="ccity" data-only="letters" value={form.city || ''} onChange={set('city')} /></Field>
        <Field label="Ocupación o negocio" htmlFor="cocc"><input id="cocc" value={form.occupation || ''} onChange={set('occupation')} placeholder="Tienda, taxista, empleado…" /></Field>
        <div className="span-2"><Field label="Dirección del negocio o trabajo" htmlFor="cbaddr"><input id="cbaddr" value={form.businessAddress || ''} onChange={set('businessAddress')} /></Field></div>
        <div className="span-2"><Field label="Ubicación en el mapa" hint="Tómala en la casa o el negocio del cliente: la usa el rutero de cobro.">
          <LocationButton lat={form.lat} lng={form.lng} onChange={({ lat, lng }) => setForm((f) => ({ ...f, lat, lng }))} />
        </Field></div>

        <div className="section-title">Crédito</div>
        {admin && (
          <Field label="Prestamista asignado" htmlFor="clender" hint={editing ? 'Si cambias el prestamista, sus créditos activos pasan a la nueva ruta' : null}>
            <select id="clender" value={form.lenderId || ''} onChange={set('lenderId')}>
              <option value="">Sin asignar</option>
              {lenders.map((l) => <option key={l.id} value={l.id}>{l.fullName}</option>)}
            </select>
          </Field>
        )}
        {admin && <Field label="Cupo máximo" htmlFor="climit" hint="Vacío = sin límite"><MoneyInput id="climit" value={form.creditLimit} onChange={set('creditLimit')} /></Field>}
        {admin && (
          <Field label="Estado" htmlFor="cstatus">
            <select id="cstatus" value={form.status} onChange={set('status')}>{Object.entries(CUSTOMER_STATUS).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</select>
          </Field>
        )}
        <div className="span-2"><Field label="Observaciones" htmlFor="cnotes"><textarea id="cnotes" rows={2} value={form.notes || ''} onChange={set('notes')} /></Field></div>
        {error && <div className="alert bad span-2">{error}</div>}
      </form>
    </Modal>
  )
}

export default CustomerForm
