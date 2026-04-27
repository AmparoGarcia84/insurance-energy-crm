import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  type Supplier,
  type SupplierInput,
} from '../../../api/suppliers'
import SuppliersList from '../SuppliersList/SuppliersList'
import SupplierDetail from '../SupplierDetail/SupplierDetail'
import SupplierForm from '../SupplierForm/SupplierForm'
import ConfirmModal from '../../shared/ConfirmModal/ConfirmModal'

// ── Navigation stack ──────────────────────────────────────────────────────────

type SuppliersView =
  | { kind: 'list' }
  | { kind: 'detail'; supplier: Supplier }
  | { kind: 'form';   supplier: Supplier | null }

export default function Suppliers() {
  const { t } = useTranslation()
  const [stack, setStack]       = useState<SuppliersView[]>([{ kind: 'list' }])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading]   = useState(true)
  const [toDelete, setToDelete] = useState<Supplier | null>(null)

  const push = (v: SuppliersView) => setStack((s) => [...s, v])
  const pop  = ()                  => setStack((s) => s.length > 1 ? s.slice(0, -1) : s)

  useEffect(() => {
    setLoading(true)
    getSuppliers()
      .then(setSuppliers)
      .catch(() => {/* non-critical */})
      .finally(() => setLoading(false))
  }, [])

  // ── CRUD helpers ──────────────────────────────────────────────────────────

  function upsert(saved: Supplier) {
    setSuppliers((prev) => {
      const exists = prev.find((s) => s.id === saved.id)
      return exists ? prev.map((s) => (s.id === saved.id ? saved : s)) : [saved, ...prev]
    })
  }

  function remove(id: string) {
    setSuppliers((prev) => prev.filter((s) => s.id !== id))
  }

  // ── Form submit ──────────────────────────────────────────────────────────

  function handleSubmit(data: SupplierInput): Promise<Supplier> {
    const current = stack[stack.length - 1]
    if (current.kind === 'form' && current.supplier) {
      return updateSupplier(current.supplier.id, data)
    }
    return createSupplier(data)
  }

  function handleSaved(saved: Supplier) {
    upsert(saved)
    // If we came from detail, return to updated detail; otherwise go to list
    setStack((prev) => {
      const without = prev.slice(0, -1)
      const below   = without[without.length - 1]
      if (below?.kind === 'detail') {
        return [...without.slice(0, -1), { kind: 'detail', supplier: saved }]
      }
      return without
    })
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDeleteConfirm() {
    if (!toDelete) return
    await deleteSupplier(toDelete.id)
    remove(toDelete.id)
    setToDelete(null)
    // If we're in the detail of the deleted supplier, go back to list
    setStack((prev) => {
      const top = prev[prev.length - 1]
      return top?.kind === 'detail' && top.supplier.id === toDelete.id
        ? [{ kind: 'list' }]
        : prev
    })
  }

  // ── Refresh detail after edit ─────────────────────────────────────────────

  async function handleEditFromDetail(supplier: Supplier) {
    const fresh = await getSupplier(supplier.id).catch(() => supplier)
    push({ kind: 'form', supplier: fresh })
  }

  // ── Render: drive from stack top ─────────────────────────────────────────

  const current = stack[stack.length - 1]

  return (
    <>
      {current.kind === 'list' && (
        <SuppliersList
          suppliers={suppliers}
          loading={loading}
          onNew={() => push({ kind: 'form', supplier: null })}
          onView={(s) => push({ kind: 'detail', supplier: s })}
          onEdit={(s) => push({ kind: 'form', supplier: s })}
          onDelete={setToDelete}
        />
      )}

      {current.kind === 'detail' && (
        <SupplierDetail
          supplier={current.supplier}
          onBack={pop}
          onEdit={handleEditFromDetail}
        />
      )}

      {current.kind === 'form' && (
        <SupplierForm
          supplier={current.supplier}
          onSubmit={handleSubmit}
          onSave={handleSaved}
          onCancel={pop}
        />
      )}

      {toDelete && (
        <ConfirmModal
          title={t('suppliers.actions.delete')}
          message={t('suppliers.deleteConfirm', { name: toDelete.name })}
          onClose={() => setToDelete(null)}
          actions={[
            { label: t('suppliers.actions.cancel'), onClick: () => setToDelete(null), variant: 'secondary' },
            { label: t('suppliers.actions.delete'), onClick: handleDeleteConfirm,      variant: 'primary'   },
          ]}
        />
      )}
    </>
  )
}
