<script setup lang="ts">
import type { TownGroup } from '~/utils/newsletter'

// Towns grouped by federal state, folded away until opened. A state box chooses or clears
// all its towns and shows a half state when only some are chosen.
const props = defineProps<{ groups: TownGroup[] }>()
const model = defineModel<string[]>({ default: () => [] })
const { t } = useI18n()

const chosen = computed(() => new Set(model.value))
const chosenIn = (group: TownGroup) => group.towns.filter((town) => chosen.value.has(town.slug)).length

const setTown = (slug: string, on: boolean) => {
  const next = new Set(model.value)
  if (on) next.add(slug)
  else next.delete(slug)
  model.value = [...next]
}

const setGroup = (group: TownGroup, on: boolean) => {
  const next = new Set(model.value)
  for (const town of group.towns) {
    if (on) next.add(town.slug)
    else next.delete(town.slug)
  }
  model.value = [...next]
}

const groupLabel = (group: TownGroup) => group.label || t('newsletter.form.townsOther')
</script>

<template>
  <details class="[ archive-town-select ] group/towns">
    <summary class="flex cursor-pointer list-none flex-wrap items-baseline gap-x-3 gap-y-1 py-1 font-display text-base text-archive-ink marker:hidden">
      <span class="text-archive-red transition-transform duration-200 group-open/towns:rotate-90 motion-reduce:transition-none" aria-hidden="true">›</span>
      <span>{{ $t('newsletter.form.townsSummary') }}</span>
      <span class="text-xs text-archive-muted">{{ $t('newsletter.form.townsChosen', model.length) }}</span>
    </summary>

    <div class="mt-4 grid grid-cols-3 gap-x-8 gap-y-6 tablet:grid-cols-2 compact:grid-cols-1 compact:gap-y-4">
      <fieldset v-for="group in props.groups" :key="group.state" class="m-0 grid content-start gap-2 border-0 p-0" :data-state="group.state">
        <legend class="sr-only">{{ groupLabel(group) }}</legend>
        <ArchiveCheckbox
          :model-value="chosenIn(group) === group.towns.length"
          :indeterminate="chosenIn(group) > 0 && chosenIn(group) < group.towns.length"
          :title="$t('newsletter.form.stateAll', { state: groupLabel(group) })"
          @update:model-value="setGroup(group, $event)"
        />
        <ul class="m-0 grid list-none gap-1 p-0 pl-8">
          <li v-for="town in group.towns" :key="town.slug">
            <ArchiveCheckbox
              size="small"
              :value="town.slug"
              :title="town.title"
              :model-value="chosen.has(town.slug)"
              @update:model-value="setTown(town.slug, $event)"
            />
          </li>
        </ul>
      </fieldset>
    </div>
  </details>
</template>
