<template>
  <div class="page-container">
    <div class="content-wrapper">
      <h1 class="page-title">Sélection des sièges</h1>

      <div v-if="activeOrder" class="alert alert-warning">
        <strong>🟡 Réservation en cours</strong><br />
        ⏱ Temps restant : {{ formattedTime }}

        <div style="margin-top:12px; display:flex; gap:12px; flex-wrap:wrap;">
          <button class="btn btn-primary" @click="pay">
            Reprendre le paiement
          </button>

          <button class="btn btn-secondary" @click="cancelActiveOrder">
            Annuler la réservation
          </button>
        </div>
      </div>

      <!-- SVG SALLE -->
      <div class="seats-container">
        <svg viewBox="0 0 420 320" class="seats-svg" preserveAspectRatio="xMidYMid meet">
        <rect
          v-for="seat in seats"
          :key="seat.id"
          :x="seat.x"
          :y="seat.y"
          width="40"
          height="40"
          rx="4"
          ry="4"
          :fill="seatFill(seat)"
          :style="{
            cursor:
              seat.status === 'free' && !activeOrder
                ? 'pointer'
                : 'not-allowed',
            opacity:
              seat.status === 'free' && activeOrder
                ? 0.4
                : 1
          }"
          :title="
            activeOrder && seat.status === 'free'
              ? 'Une réservation est déjà en cours'
              : seat.status !== 'free'
                ? 'Siège indisponible'
                : ''
          "
          @click="
            seat.status === 'free' &&
            !activeOrder &&
            toggleSeat(seat.id)
          "
        />
      <text
        v-for="seat in seats"
        :key="seat.id + '-label'"
        :x="seat.x + 20"
        :y="seat.y + 26"
        text-anchor="middle"
        font-size="12"
        pointer-events="none"
      >
        {{ seat.label }}
      </text>
        </svg>
      </div>

      <div class="selection-info">
        <p v-if="selectedSeatIds.length > 0" class="selection-text">
          <strong>{{ selectedSeatIds.length }}</strong> siège{{ selectedSeatIds.length > 1 ? 's' : '' }} sélectionné{{ selectedSeatIds.length > 1 ? 's' : '' }}
        </p>
        <p v-else class="selection-text empty">Aucun siège sélectionné</p>
      </div>

      <div class="actions">
        <button
          class="btn btn-primary"
          @click="openModal"
          :disabled="selectedSeatIds.length === 0"
        >
          Réserver
        </button>
      </div>

      <div v-if="error" class="alert alert-danger">{{ error }}</div>
    </div>

    <!-- MODAL -->
    <div v-if="showModal" class="overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">Informations de réservation</h2>
          <button type="button" class="btn-close" @click="closeModal" aria-label="Fermer">
            <span>&times;</span>
          </button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="submitReservation">
            <div class="form-group">
              <label for="firstName" class="form-label">
                Prénom <span class="text-danger">*</span>
              </label>
              <input
                id="firstName"
                v-model="form.firstName"
                type="text"
                class="form-control"
                :class="{ 'is-invalid': errors.firstName, 'is-valid': touched.firstName && !errors.firstName }"
                placeholder="Entrez votre prénom"
                @blur="validateField('firstName')"
                @input="clearError('firstName')"
              />
              <div class="invalid-feedback">
                <span v-if="errors.firstName">{{ errors.firstName }}</span>
                <span v-else style="visibility: hidden;">&nbsp;</span>
              </div>
            </div>

            <div class="form-group">
              <label for="lastName" class="form-label">
                Nom <span class="text-danger">*</span>
              </label>
              <input
                id="lastName"
                v-model="form.lastName"
                type="text"
                class="form-control"
                :class="{ 'is-invalid': errors.lastName, 'is-valid': touched.lastName && !errors.lastName }"
                placeholder="Entrez votre nom"
                @blur="validateField('lastName')"
                @input="clearError('lastName')"
              />
              <div class="invalid-feedback">
                <span v-if="errors.lastName">{{ errors.lastName }}</span>
                <span v-else style="visibility: hidden;">&nbsp;</span>
              </div>
            </div>

            <div class="form-group">
              <label for="email" class="form-label">
                Email <span class="text-danger">*</span>
              </label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                class="form-control"
                :class="{ 'is-invalid': errors.email, 'is-valid': touched.email && !errors.email }"
                placeholder="exemple@email.com"
                @blur="validateField('email')"
                @input="clearError('email')"
              />
              <div class="invalid-feedback">
                <span v-if="errors.email">{{ errors.email }}</span>
                <span v-else style="visibility: hidden;">&nbsp;</span>
              </div>
            </div>

            <div class="form-group">
              <label for="phone" class="form-label">
                Téléphone <span class="text-danger">*</span>
              </label>
              <input
                id="phone"
                v-model="form.phone"
                type="tel"
                class="form-control"
                :class="{ 'is-invalid': errors.phone, 'is-valid': touched.phone && !errors.phone }"
                placeholder="06 12 34 56 78"
                @blur="validateField('phone')"
                @input="clearError('phone')"
              />
              <div class="invalid-feedback">
                <span v-if="errors.phone">{{ errors.phone }}</span>
                <span v-else style="visibility: hidden;">&nbsp;</span>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeModal">
                Annuler
              </button>
              <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2"></span>
                {{ isSubmitting ? 'Traitement...' : 'Payer' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

/* =====================
   TYPES
===================== */
type SeatStatus = 'free' | 'hold' | 'paid'

type Seat = {
  id: string
  label: string
  status: SeatStatus
  x: number
  y: number
}

/* =====================
   STATE
===================== */
const seats = ref<Seat[]>([])
const selectedSeatIds = ref<string[]>([])
const orderId = ref<string | null>(null)
const error = ref<string | null>(null)

const activeOrder = ref<{
  orderId: string
  expiresAt: string
} | null>(null)

const showModal = ref(false)
const isSubmitting = ref(false)

const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: ''
})

const errors = ref<Record<string, string>>({})
const touched = ref<Record<string, boolean>>({})

/* =====================
   TIMER (SOURCE BACKEND)
===================== */
const remainingSeconds = ref(0)
let timerInterval: number | undefined

const formattedTime = computed(() => {
  const m = Math.floor(remainingSeconds.value / 60)
  const s = remainingSeconds.value % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})

function startTimerFromExpiresAt(expiresAt: string) {
  if (timerInterval) clearInterval(timerInterval)

  const update = () => {
    const diff = Math.floor(
      (new Date(expiresAt).getTime() - Date.now()) / 1000
    )

    remainingSeconds.value = Math.max(0, diff)

    if (remainingSeconds.value <= 0) {
      clearInterval(timerInterval)
      timerInterval = undefined
      activeOrder.value = null
      orderId.value = null
      selectedSeatIds.value = []
      localStorage.removeItem('order_id')
      error.value = 'Réservation expirée'
    }
  }

  update()
  timerInterval = window.setInterval(update, 1000)
}

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

/* =====================
   LOAD SEATS
===================== */
async function loadSeats() {
  const data = await $fetch<any[]>('/api/seats')
  seats.value = data.map((seat, i) => ({
    ...seat,
    x: (i % 6) * 60 + 20,
    y: Math.floor(i / 6) * 60 + 20
  }))
}

/* =====================
   REPRISE AUTO AU REFRESH
===================== */
onMounted(async () => {
  await loadSeats()

  if (!process.client) return

  const storedOrderId = localStorage.getItem('order_id')
  if (!storedOrderId) return

  try {
    const res = await $fetch<{
      status: 'pending' | 'paid' | 'expired' | 'cancelled' | 'not_found'
      expiresAt?: string
    }>('/api/order-status', {
      query: { orderId: storedOrderId }
    })

    /* =====================
       🟢 COMMANDE PAYÉE
       → nettoyage total
    ===================== */
    if (res.status === 'paid') {
      localStorage.removeItem('order_id')
      activeOrder.value = null
      orderId.value = null

      // 🔁 refresh visuel (sièges en paid)
      await loadSeats()
      return
    }

    /* =====================
       🟡 COMMANDE PENDING
       → reprise UX PRO
    ===================== */
    if (res.status === 'pending' && res.expiresAt) {
      activeOrder.value = {
        orderId: storedOrderId,
        expiresAt: res.expiresAt
      }

      orderId.value = storedOrderId
      startTimerFromExpiresAt(res.expiresAt)
      return
    }

    /* =====================
       🔴 EXPIRÉ / ANNULÉ / NOT_FOUND
       → cleanup
    ===================== */
    localStorage.removeItem('order_id')
    activeOrder.value = null
    orderId.value = null

    await loadSeats()
  } catch (err) {
    console.error('order-status error', err)

    localStorage.removeItem('order_id')
    activeOrder.value = null
    orderId.value = null
  }
})


/* =====================
   UI
===================== */
function seatFill(seat: Seat) {
  if (activeOrder.value && seat.status === 'free') return '#e0e0e0'
  if (seat.status === 'paid') return '#e53935'
  if (seat.status === 'hold') return '#ffb300'
  if (selectedSeatIds.value.includes(seat.id)) return '#4caf50'
  return '#ccc'
}

function toggleSeat(id: string) {
  if (activeOrder.value) return

  selectedSeatIds.value.includes(id)
    ? selectedSeatIds.value = selectedSeatIds.value.filter(s => s !== id)
    : selectedSeatIds.value.push(id)
}

/* =====================
   MODAL
===================== */
function openModal() {
  if (activeOrder.value) return
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  errors.value = {}
  touched.value = {}
}

/* =====================
   VALIDATION
===================== */
function validateField(field: keyof typeof form.value) {
  touched.value[field] = true
  const v = form.value[field].trim()

  if (!v) {
    errors.value[field] = 'Champ requis'
    return
  }

  if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
    errors.value.email = 'Email invalide'
    return
  }

  if (field === 'phone') {
    const n = v.replace(/\D/g, '')
    if (!/^(\+33|0)[1-9]\d{8}$/.test(n)) {
      errors.value.phone = 'Téléphone invalide'
      return
    }
  }

  delete errors.value[field]
}

function clearError(field: keyof typeof form.value) {
  delete errors.value[field]
}

function validateForm() {
  Object.keys(form.value).forEach(k =>
    validateField(k as keyof typeof form.value)
  )
  return Object.keys(errors.value).length === 0
}

/* =====================
   HOLD SEATS
===================== */
async function submitReservation() {
  if (!validateForm()) return

  isSubmitting.value = true
  error.value = null

  try {
    const res = await $fetch<{
      orderId: string
      expiresAt: string
    }>('/api/hold-seats', {
      method: 'POST',
      body: {
        seatIds: selectedSeatIds.value,
        ...form.value,
        phone: form.value.phone.replace(/\D/g, '')
      }
    })

    orderId.value = res.orderId
    activeOrder.value = {
      orderId: res.orderId,
      expiresAt: res.expiresAt
    }

    localStorage.setItem('order_id', res.orderId)

    // 🔥 nettoyage UX CRITIQUE
    selectedSeatIds.value = []
    form.value = { firstName: '', lastName: '', email: '', phone: '' }
    errors.value = {}
    touched.value = {}

    startTimerFromExpiresAt(res.expiresAt)
    await pay()
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Erreur réservation'
  } finally {
    isSubmitting.value = false
  }
}

/* =====================
   ANNULATION UX PRO
===================== */
async function cancelActiveOrder() {
  if (!activeOrder.value) return

  await $fetch('/api/cancel-order', {
    method: 'POST',
    body: { orderId: activeOrder.value.orderId }
  })

  activeOrder.value = null
  orderId.value = null
  selectedSeatIds.value = []
  localStorage.removeItem('order_id')

  await loadSeats()
}

/* =====================
   STRIPE
===================== */
async function pay() {
  if (!orderId.value) return

  const res = await $fetch<{ url: string }>('/api/create-checkout-session', {
    method: 'POST',
    body: { orderId: orderId.value }
  })

  window.location.href = res.url
}
</script>



<style scoped>
/* =====================
   PAGE LAYOUT
===================== */
.page-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    sans-serif;
}

.content-wrapper {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.page-title {
  margin: 0 0 32px 0;
  font-size: 32px;
  font-weight: 600;
  color: #212529;
  text-align: center;
}

.seats-container {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.seats-svg {
  width: 100%;
  max-width: 420px;
  height: auto;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  background: #f8f9fa;
}

.selection-info {
  margin-bottom: 24px;
  text-align: center;
}

.selection-text {
  margin: 0;
  font-size: 16px;
  color: #212529;
}

.selection-text strong {
  color: #0d6efd;
  font-weight: 600;
}

.selection-text.empty {
  color: #6c757d;
}

.actions {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

/* =====================
   ALERTS
===================== */
.alert {
  padding: 12px 16px;
  margin-bottom: 16px;
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 14px;
}

.alert-info {
  color: #084298;
  background-color: #cfe2ff;
  border-color: #b6d4fe;
}

.alert-danger {
  color: #842029;
  background-color: #f8d7da;
  border-color: #f5c2c7;
}

.mb-3 {
  margin-bottom: 1rem !important;
}

/* =====================
   MODAL
===================== */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  animation: fadeIn 0.15s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal {
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  animation: slideDown 0.3s ease-out;
  margin: auto;
}

@keyframes slideDown {
  from {
    transform: translateY(-50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #dee2e6;
}

.modal-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #212529;
}

.btn-close {
  background: none;
  border: none;
  font-size: 28px;
  line-height: 1;
  color: #6c757d;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-close:hover {
  background-color: #f8f9fa;
  color: #212529;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #dee2e6;
  margin-top: auto;
}

/* =====================
   FORM
===================== */
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #212529;
}

.form-control {
  display: block;
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: #212529;
  background-color: #fff;
  border: 1px solid #ced4da;
  border-radius: 6px;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  box-sizing: border-box;
}

.form-control:focus {
  outline: 0;
  border-color: #86b7fe;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.form-control::placeholder {
  color: #6c757d;
  opacity: 1;
}

.form-control.is-invalid {
  border-color: #dc3545;
  padding-right: calc(1.5em + 0.75rem);
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath d='m5.8 3.6 .4.4.4-.4m0 4.8-.4-.4-.4.4'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right calc(0.375em + 0.1875rem) center;
  background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
}

.form-control.is-invalid:focus {
  border-color: #dc3545;
  box-shadow: 0 0 0 0.25rem rgba(220, 53, 69, 0.25);
}

.form-control.is-valid {
  border-color: #198754;
  padding-right: calc(1.5em + 0.75rem);
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3e%3cpath fill='%23198754' d='m2.3 6.73.98-.98-.98-.98-.98.98.98.98zm1.4-3.46L2.3 4.77l-.7-.7L3.7 2.27l.7.7z'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right calc(0.375em + 0.1875rem) center;
  background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
}

.form-control.is-valid:focus {
  border-color: #198754;
  box-shadow: 0 0 0 0.25rem rgba(25, 135, 84, 0.25);
}

.invalid-feedback {
  display: block;
  width: 100%;
  margin-top: 6px;
  font-size: 13px;
  color: #dc3545;
  min-height: 20px;
  line-height: 1.4;
}

.form-text {
  margin-top: 6px;
  font-size: 12px;
}

.text-muted {
  color: #6c757d !important;
}

.text-danger {
  color: #dc3545 !important;
}

/* =====================
   BUTTONS
===================== */
.btn {
  display: inline-block;
  font-weight: 400;
  line-height: 1.5;
  color: #212529;
  text-align: center;
  text-decoration: none;
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  background-color: transparent;
  border: 1px solid transparent;
  padding: 10px 16px;
  font-size: 14px;
  border-radius: 6px;
  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out,
    border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-primary {
  color: #fff;
  background-color: #0d6efd;
  border-color: #0d6efd;
}

.btn-primary:hover:not(:disabled) {
  color: #fff;
  background-color: #0b5ed7;
  border-color: #0a58ca;
}

.btn-primary:focus {
  color: #fff;
  background-color: #0b5ed7;
  border-color: #0a58ca;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.5);
}

.btn-secondary {
  color: #fff;
  background-color: #6c757d;
  border-color: #6c757d;
}

.btn-secondary:hover:not(:disabled) {
  color: #fff;
  background-color: #5c636a;
  border-color: #565e64;
}

.btn-secondary:focus {
  color: #fff;
  background-color: #5c636a;
  border-color: #565e64;
  box-shadow: 0 0 0 0.25rem rgba(108, 117, 125, 0.5);
}

/* =====================
   SPINNER
===================== */
.spinner-border {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  vertical-align: text-bottom;
  border: 0.15em solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spinner-border 0.75s linear infinite;
}

.spinner-border-sm {
  width: 0.875rem;
  height: 0.875rem;
  border-width: 0.125em;
}

.me-2 {
  margin-right: 0.5rem !important;
}

@keyframes spinner-border {
  to {
    transform: rotate(360deg);
  }
}

/* =====================
   RESPONSIVE - Bootstrap breakpoints
===================== */
/* Extra small devices (phones, less than 576px) */
@media (max-width: 575.98px) {
  .page-container {
    padding: 20px 10px;
  }

  .content-wrapper {
    padding: 24px 16px;
  }

  .page-title {
    font-size: 24px;
    margin-bottom: 24px;
  }

  .seats-svg {
    max-width: 100%;
  }

  .modal {
    width: 95%;
    max-width: none;
    margin: 10px;
  }

  .modal-header {
    padding: 16px 20px;
  }

  .modal-body {
    padding: 20px;
  }

  .modal-footer {
    padding: 12px 20px;
    flex-direction: column;
    gap: 8px;
  }

  .modal-footer .btn {
    width: 100%;
  }

  .form-control {
    font-size: 16px; /* Prevents zoom on iOS */
  }
}

/* Small devices (landscape phones, 576px and up) */
@media (min-width: 576px) and (max-width: 767.98px) {
  .page-container {
    padding: 30px 15px;
  }

  .content-wrapper {
    padding: 32px 24px;
  }

  .modal {
    width: 90%;
  }
}

/* Medium devices (tablets, 768px and up) */
@media (min-width: 768px) and (max-width: 991.98px) {
  .content-wrapper {
    padding: 36px 32px;
  }
}

/* Large devices (desktops, 992px and up) */
@media (min-width: 992px) {
  .content-wrapper {
    padding: 40px;
  }
}
</style>
