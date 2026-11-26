import React, { useState } from 'react'
import { MdFace, MdPhotoCamera, MdPhotoLibrary, MdLock } from 'react-icons/md'
import api, { errorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Avatar, Badge, Card, Field, PageHead, Spinner, useToast } from '../components/ui'
import { fileToDataUrl } from '../utils/image'
import { AvatarPicker } from '../components/avatars'
import { ROLE_LABELS } from '../utils/nav'
import { phoneProps } from '../utils/phones'

const ProfilePage = () => {
  const { user, setUser } = useAuth()
  const [contact, setContact] = useState({ email: user.email || '', phone: user.phone || '' })
  const [pass, setPass] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [busy, setBusy] = useState('')
  const [choosing, setChoosing] = useState(false)
  const [toast, toastNode] = useToast()

  const save = async (body, what, ok) => {
    setBusy(what)
    try { const { data } = await api.put('/perfil', body); setUser(data); toast(ok); return true } catch (e) { toast(errorMessage(e), 'bad'); return false } finally { setBusy('') }
  }

  const onPhoto = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try { await save({ avatarUrl: await fileToDataUrl(file, { max: 320 }) }, 'photo', 'Foto actualizada') } catch (err) { toast(err.message, 'bad') }
  }

  const changePass = async (e) => {
    e.preventDefault()
    if (pass.newPassword !== pass.confirm) { toast('Las contraseñas nuevas no coinciden', 'bad'); return }
    if (await save({ currentPassword: pass.currentPassword, newPassword: pass.newPassword }, 'pass', 'Contraseña actualizada')) setPass({ currentPassword: '', newPassword: '', confirm: '' })
  }

  return (
    <div className="stack">
      <PageHead title="Mi perfil" subtitle="Tu foto, tus datos de contacto y tu contraseña." />
      <div className="grid grid-1-2">
        <Card>
          <div className="profile-card">
            <Avatar user={user} size="lg" />
            <div className="photo-actions center">
              <label className="btn btn-sm">{busy === 'photo' ? <Spinner /> : <MdPhotoCamera />} Tomar foto<input type="file" accept="image/*" capture="user" hidden onChange={onPhoto} /></label>
              <label className="btn btn-sm"><MdPhotoLibrary /> Cargar foto<input type="file" accept="image/*" hidden onChange={onPhoto} /></label>
              <button type="button" className="btn btn-sm" onClick={() => setChoosing(true)}><MdFace /> Avatar</button>
            </div>
            {choosing && <AvatarPicker onClose={() => setChoosing(false)} onPick={({ photo }) => { setChoosing(false); save({ avatarUrl: photo }, 'photo', 'Avatar actualizado') }} />}
            <h2>{user.fullName}</h2>
            <Badge tone="dark">{ROLE_LABELS[user.role]}</Badge>
            <dl className="meta">
              <div><dt>Usuario</dt><dd>{user.username}</dd></div>
              <div><dt>Identificación</dt><dd>{user.identification}</dd></div>
            </dl>
          </div>
        </Card>
        <div className="stack">
          <Card title="Datos de contacto">
            <form className="form-grid" onSubmit={(e) => { e.preventDefault(); save(contact, 'contact', 'Datos guardados') }}>
              <Field label="Celular" htmlFor="phone"><input id="phone" {...phoneProps()} value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} inputMode="numeric" /></Field>
              <Field label="Correo" htmlFor="email"><input id="email" type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} /></Field>
              <div className="span-2 right"><button type="submit" className="btn btn-primary" disabled={busy === 'contact'}>{busy === 'contact' && <Spinner />} Guardar</button></div>
            </form>
          </Card>
          <Card title="Cambiar contraseña" icon={<MdLock />}>
            {user.role === 'cliente' ? <p className="muted" style={{ margin: 0 }}>Tu contraseña es tu número de documento. No se puede cambiar.</p> : (
            <form className="form-grid" onSubmit={changePass}>
              <div className="span-2"><Field label="Contraseña actual" htmlFor="cp"><input id="cp" type="password" autoComplete="current-password" value={pass.currentPassword} onChange={(e) => setPass({ ...pass, currentPassword: e.target.value })} /></Field></div>
              <Field label="Nueva contraseña" htmlFor="np" hint="Mínimo 8 caracteres"><input id="np" type="password" autoComplete="new-password" value={pass.newPassword} onChange={(e) => setPass({ ...pass, newPassword: e.target.value })} /></Field>
              <Field label="Confirmar" htmlFor="cf"><input id="cf" type="password" autoComplete="new-password" value={pass.confirm} onChange={(e) => setPass({ ...pass, confirm: e.target.value })} /></Field>
              <div className="span-2 right"><button type="submit" className="btn btn-primary" disabled={busy === 'pass'}>{busy === 'pass' && <Spinner />} Cambiar contraseña</button></div>
            </form>
            )}
          </Card>
        </div>
      </div>
      {toastNode}
    </div>
  )
}

export default ProfilePage
