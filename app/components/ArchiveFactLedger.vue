<script setup lang="ts">
const props = withDefaults(defineProps<{
  items: Array<{
    label: string
    value: string | number
  }>
  desktopLayout?: 'row' | 'stacked'
}>(), {
  desktopLayout: 'row'
})
</script>

<template>
  <dl
    class="[ archive-fact-ledger ] m-0 grid border-y border-archive-rule-deep/28"
    :class="props.desktopLayout === 'stacked' ? 'grid-cols-1 compact:grid-cols-3' : 'grid-cols-3'"
  >
    <div
      v-for="(item, index) in items"
      :key="item.label"
      class="min-w-0 px-4 py-4 compact:px-1 compact:py-2"
      :class="[
        props.desktopLayout === 'stacked'
          ? 'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 text-left compact:block compact:text-center'
          : 'text-center',
        index > 0 && props.desktopLayout === 'stacked'
          ? 'border-t border-archive-rule-deep/20 compact:border-t-0 compact:border-l'
          : index > 0
            ? 'border-l border-archive-rule-deep/20'
            : ''
      ]"
    >
      <dt
        class="text-2xs leading-tight tracking-widest whitespace-nowrap text-archive-red uppercase compact:text-3xs compact:tracking-[0.04em]"
        :class="props.desktopLayout === 'stacked' ? 'compact:text-balance compact:whitespace-normal' : 'tablet:text-balance tablet:whitespace-normal'"
      >
        {{ item.label }}
      </dt>
      <dd
        class="m-0 mt-1 min-w-0 text-lg leading-tight compact:mt-0.5 compact:text-sm"
        :class="props.desktopLayout === 'stacked' ? 'compact:break-words compact:whitespace-normal' : 'tablet:break-words tablet:whitespace-normal'"
      >
        {{ item.value }}
      </dd>
    </div>
  </dl>
</template>
