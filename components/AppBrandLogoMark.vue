<script setup lang="ts">
import { computed, normalizeClass } from 'vue'
import AppLogo from './AppLogo.vue'

/**
 * Marque / logo : aligné sur le header (AppLogo `md` > md, picto compact ≤ md).
 */
const props = withDefaults(
  defineProps<{
    variant?: 'light' | 'dark'
    /** Si défini : lien (ex. `/` depuis le back-office) */
    to?: string
    /** Accueil site dans le header : pas d’action */
    isStatic?: boolean
    /** Coin haut-gauche fixe (billetterie /admin sans header) */
    floating?: boolean
    ariaLabel?: string
    /** Classes sur la zone cliquable (ex. `appHeader__logo` depuis AppHeader) */
    extraHitClass?: string | Record<string, boolean> | Array<string | Record<string, boolean>>
  }>(),
  {
    variant: 'light',
    to: undefined,
    isStatic: false,
    floating: false,
    ariaLabel: "Retour à l'accueil",
    extraHitClass: undefined
  }
)

const emit = defineEmits<{
  activate: []
}>()

function onButtonClick() {
  if (props.isStatic) return
  emit('activate')
}

const hitClass = computed(() =>
  normalizeClass([
    'appBrandLogoMark__hit',
    props.extraHitClass,
    { 'appBrandLogoMark__hit--static': props.isStatic }
  ])
)
</script>

<template>
  <div class="appBrandLogoMark" :class="{ 'appBrandLogoMark--floating': floating }">
    <NuxtLink
      v-if="to"
      :to="to"
      :class="hitClass"
      :aria-label="ariaLabel"
    >
      <AppLogo class="appBrandLogoMark__full" size="md" :variant="variant" />
      <svg
        class="appBrandLogoMark__compact"
        :class="{
          'appBrandLogoMark__compact--light': variant === 'light',
          'appBrandLogoMark__compact--dark': variant === 'dark'
        }"
        viewBox="0 0 867 1552"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <g
          transform="translate(0.000000,1552.000000) scale(0.100000,-0.100000)"
          fill="currentColor"
          stroke="none"
        >
          <path
            d="M6930 15296 c-116 -35 -211 -97 -309 -202 -184 -197 -321 -476 -440 -897 -46 -160 -73 -276 -211 -882 -130 -569 -255 -913 -429 -1177 -149 -225 -352 -395 -565 -474 -87 -32 -33 -26 95 11 724 208 1493 796 1968 1505 119 178 198 316 272 480 248 548 286 1016 112 1364 -89 180 -213 274 -371 282 -47 2 -95 -2 -122 -10z"
          />
          <path
            d="M4795 12819 c-144 -19 -306 -78 -412 -150 -282 -194 -405 -559 -287 -854 92 -230 326 -264 430 -62 47 90 56 138 65 358 10 253 27 335 92 448 51 90 160 210 215 236 25 13 36 23 29 27 -14 9 -39 8 -132 -3z"
          />
          <path
            d="M1875 11740 c-410 -28 -777 -96 -1009 -187 -247 -97 -446 -234 -575 -397 -142 -178 -224 -430 -224 -686 0 -182 34 -322 116 -485 227 -453 800 -812 1460 -917 155 -24 442 -29 577 -9 391 57 607 220 687 521 24 91 24 292 0 380 -92 337 -423 612 -983 818 -60 22 -192 66 -294 97 -302 93 -414 156 -465 260 -23 46 -27 64 -22 106 12 103 114 237 230 301 246 138 646 196 1272 186 154 -3 242 -2 195 2 -140 13 -825 19 -965 10z"
          />
          <path d="M2978 11713 c6 -2 18 -2 25 0 6 3 1 5 -13 5 -14 0 -19 -2 -12 -5z" />
          <path
            d="M7196 8620 c-340 -43 -652 -183 -911 -408 -141 -122 -218 -221 -363 -467 -135 -229 -190 -304 -298 -411 -201 -197 -429 -315 -781 -404 -240 -60 -477 -90 -709 -90 l-132 0 -12 88 c-18 130 -29 169 -22 77 4 -44 7 -98 7 -119 l0 -40 -55 3 c-103 4 -332 42 -464 76 -441 113 -829 332 -991 560 -117 164 -115 310 7 459 l43 51 -41 -35 c-61 -52 -120 -145 -146 -230 -31 -101 -33 -316 -4 -430 91 -361 408 -709 892 -979 208 -116 405 -196 640 -261 l139 -38 -2 -223 c-2 -314 -25 -659 -98 -1504 -84 -961 -89 -1064 -90 -1600 0 -464 9 -665 41 -970 77 -725 288 -1257 577 -1454 251 -171 522 -24 618 334 19 68 22 109 23 270 1 273 -18 393 -155 965 -101 420 -202 815 -323 1268 -236 879 -393 1696 -451 2352 -20 234 -39 530 -33 535 2 3 63 -6 134 -20 691 -132 1509 -168 2156 -95 819 93 1421 339 1793 732 419 441 521 953 284 1418 -188 370 -567 582 -1059 595 -80 2 -176 0 -214 -5z"
          />
        </g>
      </svg>
    </NuxtLink>
    <button
      v-else
      type="button"
      :class="hitClass"
      :aria-label="ariaLabel"
      @click="onButtonClick"
    >
      <AppLogo class="appBrandLogoMark__full" size="md" :variant="variant" />
      <svg
        class="appBrandLogoMark__compact"
        :class="{
          'appBrandLogoMark__compact--light': variant === 'light',
          'appBrandLogoMark__compact--dark': variant === 'dark'
        }"
        viewBox="0 0 867 1552"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <g
          transform="translate(0.000000,1552.000000) scale(0.100000,-0.100000)"
          fill="currentColor"
          stroke="none"
        >
          <path
            d="M6930 15296 c-116 -35 -211 -97 -309 -202 -184 -197 -321 -476 -440 -897 -46 -160 -73 -276 -211 -882 -130 -569 -255 -913 -429 -1177 -149 -225 -352 -395 -565 -474 -87 -32 -33 -26 95 11 724 208 1493 796 1968 1505 119 178 198 316 272 480 248 548 286 1016 112 1364 -89 180 -213 274 -371 282 -47 2 -95 -2 -122 -10z"
          />
          <path
            d="M4795 12819 c-144 -19 -306 -78 -412 -150 -282 -194 -405 -559 -287 -854 92 -230 326 -264 430 -62 47 90 56 138 65 358 10 253 27 335 92 448 51 90 160 210 215 236 25 13 36 23 29 27 -14 9 -39 8 -132 -3z"
          />
          <path
            d="M1875 11740 c-410 -28 -777 -96 -1009 -187 -247 -97 -446 -234 -575 -397 -142 -178 -224 -430 -224 -686 0 -182 34 -322 116 -485 227 -453 800 -812 1460 -917 155 -24 442 -29 577 -9 391 57 607 220 687 521 24 91 24 292 0 380 -92 337 -423 612 -983 818 -60 22 -192 66 -294 97 -302 93 -414 156 -465 260 -23 46 -27 64 -22 106 12 103 114 237 230 301 246 138 646 196 1272 186 154 -3 242 -2 195 2 -140 13 -825 19 -965 10z"
          />
          <path d="M2978 11713 c6 -2 18 -2 25 0 6 3 1 5 -13 5 -14 0 -19 -2 -12 -5z" />
          <path
            d="M7196 8620 c-340 -43 -652 -183 -911 -408 -141 -122 -218 -221 -363 -467 -135 -229 -190 -304 -298 -411 -201 -197 -429 -315 -781 -404 -240 -60 -477 -90 -709 -90 l-132 0 -12 88 c-18 130 -29 169 -22 77 4 -44 7 -98 7 -119 l0 -40 -55 3 c-103 4 -332 42 -464 76 -441 113 -829 332 -991 560 -117 164 -115 310 7 459 l43 51 -41 -35 c-61 -52 -120 -145 -146 -230 -31 -101 -33 -316 -4 -430 91 -361 408 -709 892 -979 208 -116 405 -196 640 -261 l139 -38 -2 -223 c-2 -314 -25 -659 -98 -1504 -84 -961 -89 -1064 -90 -1600 0 -464 9 -665 41 -970 77 -725 288 -1257 577 -1454 251 -171 522 -24 618 334 19 68 22 109 23 270 1 273 -18 393 -155 965 -101 420 -202 815 -323 1268 -236 879 -393 1696 -451 2352 -20 234 -39 530 -33 535 2 3 63 -6 134 -20 691 -132 1509 -168 2156 -95 819 93 1421 339 1793 732 419 441 521 953 284 1418 -188 370 -567 582 -1059 595 -80 2 -176 0 -214 -5z"
          />
        </g>
      </svg>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.appBrandLogoMark {
  line-height: 0;

  &--floating {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 60;
    pointer-events: none;
    box-sizing: border-box;
    padding-top: max(env(safe-area-inset-top), clamp(20px, 4vw, 36px));
    padding-left: max(env(safe-area-inset-left), clamp(20px, 4vw, 36px));
    padding-right: clamp(20px, 4vw, 36px);
    padding-bottom: clamp(20px, 4vw, 36px);
  }
}

.appBrandLogoMark__hit {
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  line-height: 0;
  -webkit-tap-highlight-color: transparent;
  transition:
    transform 0.3s ease,
    opacity 0.2s ease;
  pointer-events: auto;
  color: inherit;

  &:active:not(.appBrandLogoMark__hit--static) {
    transform: scale(0.95);
    opacity: 0.88;
  }
}

.appBrandLogoMark__hit--static {
  cursor: default;
  pointer-events: none;
  transition: none;

  &:active {
    transform: none;
    opacity: 1;
  }
}

.appBrandLogoMark__compact {
  display: none;
  width: 24px;
  height: auto;
  transition: color 0.4s ease;
}

.appBrandLogoMark__compact--light {
  color: #ffffff;
}

.appBrandLogoMark__compact--dark {
  color: $color-text-primary;
}

@include media-down(md) {
  .appBrandLogoMark__full {
    display: none;
  }

  .appBrandLogoMark__compact {
    display: block;
  }
}
</style>
