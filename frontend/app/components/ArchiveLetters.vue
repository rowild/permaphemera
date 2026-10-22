<script setup lang="ts">
import { pickStuckLetter, type StuckLetter } from '~/utils/seededLayout'

// A text split into letters for a letter-by-letter reveal (the start page
// hero). Screen readers get the whole text once; the letters are hidden from
// them. The letters stay inline, so the text keeps its kerning (a box per
// letter, inline-block, loses it: "Permanently" was 2 px wider) and nothing
// moves when the reveal ends; the parent animates `top`, opacity and blur.
// With `stuck`, one letter is a box, because it later falls crooked: `true`
// picks it seeded by the text, `{ index, tilt }` names it (the logo's H).
// The parent's timeline reads `data-letter` and `data-stuck` (the lean in
// degrees). With `fallen`, the stuck letter already leans: pages without the
// intro.
const props = defineProps<{
  text: string
  stuck?: boolean | StuckLetter
  fallen?: boolean
}>()

const stuckLetter = computed(() => typeof props.stuck === 'object'
  ? props.stuck
  : props.stuck ? pickStuckLetter(props.text) : null)
// The same pose the start page's drop ends in (index.vue, dropStuckLetters).
const fallenStyle = computed(() => props.fallen && stuckLetter.value
  ? { transformOrigin: '20% 90%', transform: `translateY(14%) rotate(${stuckLetter.value.tilt}deg)` }
  : undefined)
const words = computed(() => {
  const result: { index: number, character: string }[][] = [[]]
  ;[...props.text].forEach((character, index) => {
    if (character === ' ') result.push([])
    else result[result.length - 1]!.push({ index, character })
  })
  return result.filter((word) => word.length)
})
</script>

<template>
  <span class="sr-only">{{ props.text }}</span>
  <span aria-hidden="true"><template v-for="(word, wordIndex) in words" :key="wordIndex"><span class="whitespace-nowrap"><template v-for="letter in word" :key="letter.index"><span v-if="stuckLetter?.index === letter.index" class="relative inline-block" :style="fallenStyle" data-letter :data-stuck="stuckLetter.tilt">{{ letter.character }}</span><span v-else class="relative" data-letter>{{ letter.character }}</span></template></span><template v-if="wordIndex < words.length - 1">{{ ' ' }}</template></template></span>
</template>
