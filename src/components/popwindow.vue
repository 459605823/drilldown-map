<template>
  <div
    class="popwindow absolute text-red text-xl flex items-center justify-center p-4 bg-red-200 hover:bg-purple-700 cursor-pointer transition-opacity"
    @click="handleClick">
    {{ msg }}
  </div>
</template>

<script setup lang="ts">
interface Props {
  msg?: string;
}

const emit = defineEmits(['redirect']);

const props = withDefaults(defineProps<Props>(), {
  msg: 'hello',
});
const handleClick = () => {
  emit('redirect', props.msg);
};
</script>

<style lang="scss" scoped>
.popwindow {
  --tx: 0px;
  --ty: 0px;
  --opacity: 0;
  left: 0;
  top: 0;
  transform: translate(var(--tx), var(--ty));
  opacity: var(--opacity);
}
</style>
