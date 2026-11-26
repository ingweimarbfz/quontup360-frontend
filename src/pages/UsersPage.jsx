import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { MdAdd, MdEdit, MdSearch, MdManageAccounts, MdTwoWheeler } from 'react-icons/md'
import api, { errorMessage, getSiteFilter } from '../api/client'
import { Avatar, Badge, Card, Empty, Field, Modal, PageHead, Spinner, useToast } from '../components/ui'
import { DocIcon, PhotoInput } from '../components/forms'
import { ROLE_LABELS } from '../utils/nav'
import { formatDateTime } from '../utils/format'
import { LICENSE_CATS } from './vehiculos/common'
import { formErrors, LICENSE_RE } from '../utils/validate'
import { DocTypeSelect } from '../utils/docTypes'
import { phoneProps } from '../utils/phones'

const EMPTY_DRIVER = { licenseNumber: '', licenseCategory: 'A2', licenseExpires: '', licensePhotoUrl: null }
const EMPTY = { docType: '', identification: '', name: '', lastName: '', username: '', email: '', phone: '', kind: 'operativo', lender: true, driver: false, password: '', resetPassword: false, active: true, siteId: '', photoUrl: null, avatarUrl: null, idPhotoUrl: null, idPhotoBackUrl: null, lic: EMPTY_DRIVER }
const ROLE_TONE = { administrador: 'dark', prestamista: 'brand', cliente: '', conductor: 'warn' }

// KU-031: tipo de usuario del formulario y perfiles con los que puede entrar.
// administrador: siempre entra como administrador y opcionalmente como prestamista y/o conductor.
// operativo: prestamista y/o conductor. cliente: solo cliente.
const KINDS = [['administrador', 'Administrador'], ['operativo', 'Prestamista / Conductor'], ['cliente', 'Cliente']]
const fromUser = (u) => {
  const all = [u.primaryRole || u.role, ...(u.extraRoles || [])]
  const kind = all.includes('administrador') ? 'administrador' : all.includes('cliente') ? 'cliente' : 'operativo'
  return { kind, lender: all.includes('prestamista'), driver: all.includes('conductor') }
}
const profilesOf = (f) => f.kind === 'cliente' ? ['cliente'] : [...(f.kind === 'administrador' ? ['administrador'] : []), ...(f.lender ? ['prestamista'] : []), ...(f.driver ? ['conductor'] : [])]

const UserForm = ({ initial, onClose, onSaved }) => {
  const editing = Boolean(initial?.id)
  const [form, setForm] = useState(editing ? { ...EMPTY, ...initial, ...fromUser(initial), siteId: initial.siteId ?? '', password: '', email: initial.email || '', phone: initial.phone || '', lic: EMPTY_DRIVER } : { ...EMPTY, siteId: getSiteFilter() || '' })
  const [sites, setSites] = useState([])
  useEffect(() => { api.get('/sedes', { params: { activas: 1, sede: undefined } }).then(({ data }) => setSites(data)).catch(() => {}) }, [])
  // Las fotos no vienen en la lista: se cargan al abrir el usuario.
  const [loadingPhotos, setLoadingPhotos] = useState(editing)
  useEffect(() => {
    if (!editing) return
    api.get(`/usuarios/${initial.id}`).then(({ data }) => setForm((f) => ({ ...f, photoUrl: data.photoUrl, idPhotoUrl: data.idPhotoUrl, idPhotoBackUrl: data.idPhotoBackUrl, lic: data.driver ? { ...EMPTY_DRIVER, ...data.driver, licenseExpires: data.driver.licenseExpires || '' } : f.lic })))
      .catch(() => {}).finally(() => setLoadingPhotos(false))
  }, [editing, initial?.id])
  const isClient = form.kind === 'cliente'
  const setLic = (k) => (e) => setForm((f) => ({ ...f, lic: { ...f.lic, [k]: e?.target ? e.target.value : e } }))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const profiles = profilesOf(form)
    const errs = formErrors({ identification: ['doc', form.identification, true], name: ['name', form.name, true], lastName: ['name', form.lastName], username: ['username', form.username, true], phone: ['phone', form.phone, form.driver], email: ['email', form.email] })
    if (form.kind === 'operativo' && !form.lender && !form.driver) errs.unshift('Marca si será prestamista, conductor o ambos.')
    if (form.driver && (!form.lic.licenseNumber || !form.lic.licenseExpires)) errs.push('Completa el número y el vencimiento de la licencia de conducción.')
    else if (form.driver && !LICENSE_RE.test(form.lic.licenseNumber)) errs.push('El número de licencia solo admite letras y números (3 a 20), sin espacios ni caracteres especiales.')
    if (!isClient && (!form.photoUrl || !form.idPhotoUrl || !form.idPhotoBackUrl)) errs.push('Toma o carga la foto de la persona y la de su documento por ambas caras.')
    if (errs.length) return setError(errs.join(' '))
    setSaving(true)
    try {
      const { lic, kind, lender, driver, ...rest } = form
      const body = { ...rest, role: profiles[0], profiles, driver: driver ? lic : null, siteId: lender ? form.siteId : '' }
      const { data } = editing ? await api.put(`/usuarios/${initial.id}`, body) : await api.post('/usuarios', body)
      onSaved(data, editing)
    } catch (err) {
      setError(errorMessage(err))
    } finally { setSaving(false) }
  }

  return (
    <Modal size="lg" title={editing ? 'Editar usuario' : 'Nuevo usuario'} onClose={onClose}
      footer={<><button type="button" className="btn" onClick={onClose}>Cancelar</button><button type="submit" form="user-form" className="btn btn-primary" disabled={saving}>{saving ? <Spinner /> : null} Guardar</button></>}>
      <form id="user-form" onSubmit={submit} className="form-grid" noValidate>
        {!isClient && (
          <div className="span-2 photo-row">
            <Field label="Foto de la persona" required>{loadingPhotos ? <Spinner /> : <PhotoInput value={form.photoUrl} withThumb avatars capture="user" label="Tomar foto" onChange={({ photo, thumb }) => setForm((f) => ({ ...f, photoUrl: photo, avatarUrl: thumb }))} />}</Field>
            <Field label="Documento · frente" required>{loadingPhotos ? <Spinner /> : <PhotoInput doc value={form.idPhotoUrl} label="Frente" placeholder={<DocIcon side="front" />} onChange={(v) => setForm((f) => ({ ...f, idPhotoUrl: v }))} />}</Field>
            <Field label="Documento · reverso" required>{loadingPhotos ? <Spinner /> : <PhotoInput doc value={form.idPhotoBackUrl} label="Reverso" placeholder={<DocIcon side="back" />} onChange={(v) => setForm((f) => ({ ...f, idPhotoBackUrl: v }))} />}</Field>
          </div>
        )}
        <Field label="Tipo de usuario" htmlFor="kind" required>
          <select id="kind" value={form.kind} onChange={(e) => { const kind = e.target.value; setForm((f) => ({ ...f, kind, lender: kind === 'operativo' ? (f.lender || !f.driver) : kind === 'administrador' ? false : f.lender, driver: kind === 'cliente' ? false : f.driver })) }}>
            {KINDS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        {form.lender && form.kind !== 'cliente' ? (
          <Field label="Sede (cobro)" htmlFor="siteId" hint="La ciudad o cobro donde trabaja este rutero">
            <select id="siteId" value={form.siteId} onChange={set('siteId')}><option value="">Sin sede</option>{sites.map((s) => <option key={s.id} value={s.id}>{s.name}{s.city ? ` · ${s.city}` : ''}</option>)}</select>
          </Field>
        ) : <div className="hide-sm" />}
        {!isClient && (
          <div className="span-2 profile-checks">
            <span className="profile-checks-title">{form.kind === 'administrador' ? 'También puede entrar como' : 'Perfiles de este usuario'}</span>
            <label className={`check-card${form.lender ? ' on' : ''}`}><input type="checkbox" checked={form.lender} onChange={set('lender')} /><span><b>Prestamista</b><small>Cobra una ruta: clientes, créditos, pagos y caja</small></span></label>
            <label className={`check-card${form.driver ? ' on' : ''}`}><input type="checkbox" checked={form.driver} onChange={set('driver')} /><span><b>Conductor</b><small>Maneja un vehículo de la flota. Pide los datos de la licencia</small></span></label>
            {profilesOf(form).length > 1 && <small className="hint">Entra con el mismo usuario y contraseña, y al iniciar sesión elige el perfil.</small>}
          </div>
        )}
        <Field label="Tipo de documento" htmlFor="docType"><DocTypeSelect id="docType" value={form.docType} onChange={(v) => setForm((f) => ({ ...f, docType: v }))} /></Field>
        <Field label="Número de documento" htmlFor="identification" required>
          <input id="identification" minLength={5} maxLength={15} value={form.identification} onChange={set('identification')} inputMode="numeric" />
        </Field>
        <Field label="Nombres" htmlFor="name" required><input id="name" data-only="letters" value={form.name} onChange={set('name')} /></Field>
        <Field label="Apellidos" htmlFor="lastName"><input id="lastName" data-only="letters" value={form.lastName} onChange={set('lastName')} /></Field>
        <Field label="Usuario" htmlFor="username" required hint="Con este nombre inicia sesión">
          <input id="username" value={form.username} onChange={set('username')} autoCapitalize="none" placeholder="nombre.apellido" />
        </Field>
        {isClient || !editing ? (
          <Field label="Contraseña" htmlFor="password" hint={isClient ? 'El cliente siempre entra con su número de identificación' : 'Es el número de identificación. Al entrar la puede cambiar en "Mi perfil"'}>
            <input id="password" value={form.identification} readOnly disabled placeholder="Número de identificación" />
          </Field>
        ) : (
          <Field label="Nueva contraseña" htmlFor="password" hint="Déjala vacía para no cambiarla">
            <input id="password" type="password" value={form.password} onChange={set('password')} autoComplete="new-password" disabled={form.resetPassword} />
          </Field>
        )}
        <Field label="Celular" htmlFor="phone" required={form.driver}><input {...phoneProps()} id="phone" value={form.phone || ''} onChange={set('phone')} /></Field>
        <Field label="Correo" htmlFor="email"><input id="email" type="email" value={form.email || ''} onChange={set('email')} placeholder="nombre@correo.com" /></Field>
        {form.driver && !isClient && (
          <div className="span-2 lic-box">
            <h4><MdTwoWheeler /> Licencia de conducción</h4>
            <div className="form-grid">
              <Field label="Número de licencia" htmlFor="lic-n" required><input id="lic-n" value={form.lic.licenseNumber || ''} onChange={setLic('licenseNumber')} data-only="alnum" autoCapitalize="characters" minLength={3} maxLength={20} /></Field>
              <Field label="Categoría" htmlFor="lic-c" required><select id="lic-c" value={form.lic.licenseCategory} onChange={setLic('licenseCategory')}>{LICENSE_CATS.map((c) => <option key={c} value={c}>{c}{c.startsWith('A') ? ' · motos' : c.startsWith('B') ? ' · carros particulares' : ' · servicio público'}</option>)}</select></Field>
              <Field label="Vence" htmlFor="lic-v" required><input id="lic-v" type="date" value={form.lic.licenseExpires || ''} onChange={setLic('licenseExpires')} /></Field>
              <Field label="Foto de la licencia"><PhotoInput doc value={form.lic.licensePhotoUrl} onChange={setLic('licensePhotoUrl')} label="Tomar foto" /></Field>
            </div>
          </div>
        )}
        {editing && !isClient && <label className="check span-2"><input type="checkbox" checked={form.resetPassword} onChange={set('resetPassword')} /> Volver la contraseña al número de identificación</label>}
        <label className="check span-2"><input type="checkbox" checked={form.active} onChange={set('active')} /> Usuario activo</label>
        {error && <div className="alert bad span-2">{error}</div>}
      </form>
    </Modal>
  )
}

const UsersPage = () => {
  const [users, setUsers] = useState(null)
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('')
  const [editing, setEditing] = useState(null)
  const [toast, toastNode] = useToast()

  const load = useCallback(() => {
    api.get('/usuarios').then(({ data }) => setUsers(data)).catch((e) => { setUsers([]); toast(errorMessage(e), 'bad') })
  }, [toast])
  useEffect(() => { load() }, [load])

  const shown = useMemo(() => (users || []).filter((u) => (!role || (u.profiles || [u.role]).includes(role)) &&
    (!query || `${u.fullName} ${u.username} ${u.identification}`.toLowerCase().includes(query.toLowerCase()))), [users, query, role])

  const onSaved = (u, wasEditing) => {
    setUsers((list) => (wasEditing ? list.map((x) => (x.id === u.id ? u : x)) : [...list, u]))
    setEditing(null)
    toast(wasEditing ? 'Usuario actualizado' : 'Usuario creado')
  }

  return (
    <div className="stack">
      <PageHead title="Usuarios" subtitle="Administradores, prestamistas, conductores y clientes con acceso a la app.">
        <button type="button" className="btn btn-primary" onClick={() => setEditing({})}><MdAdd /> Nuevo usuario</button>
      </PageHead>
      <Card flush>
        <div className="toolbar">
          <div className="input-icon grow"><MdSearch /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre, usuario o identificación" /></div>
          <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Filtrar por rol">
            <option value="">Todos los roles</option>
            {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        {!users ? <div className="splash" style={{ minHeight: 200 }}><Spinner /></div>
          : !shown.length ? <Empty icon={<MdManageAccounts />}>No hay usuarios con ese filtro.</Empty>
            : (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Usuario</th><th>Rol</th><th className="hide-sm">Contacto</th><th className="hide-md">Último ingreso</th><th>Estado</th><th /></tr></thead>
                  <tbody>
                    {shown.map((u) => (
                      <tr key={u.id}>
                        <td><div className="person"><Avatar user={u} size="sm" /><div><strong>{u.fullName}</strong><small>{u.username} · {u.identification}</small></div></div></td>
                        <td><span className="badges">{(u.profiles || [u.role]).map((r) => <Badge key={r} tone={ROLE_TONE[r]}>{ROLE_LABELS[r]}</Badge>)}</span>{u.site && <><br /><small>{u.site.name}</small></>}</td>
                        <td className="hide-sm"><small>{u.phone || '—'}<br />{u.email || ''}</small></td>
                        <td className="hide-md"><small>{formatDateTime(u.lastLoginAt)}</small></td>
                        <td>{u.active ? <Badge tone="ok">Activo</Badge> : <Badge tone="muted">Inactivo</Badge>}</td>
                        <td className="right"><button type="button" className="btn btn-ghost btn-icon" onClick={() => setEditing(u)} aria-label={`Editar ${u.fullName}`}><MdEdit /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
      </Card>
      {editing && <UserForm initial={editing} onClose={() => setEditing(null)} onSaved={onSaved} />}
      {toastNode}
    </div>
  )
}

export default UsersPage
