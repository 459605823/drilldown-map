<template>
  <div
    class="popwindow absolute text-red flex items-center justify-center p-4 bg-red-200 hover:bg-purple-700 cursor-pointer"
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
onMounted(() => {
  console.log(props);
});
</script>

<style lang="scss" scoped>
.popwindow {
  --tx: 0px;
  --ty: 0px;
  --visible: hidden;
  left: 0;
  top: 0;
  transform: translate(var(--tx), var(--ty));
  visibility: var(--visible);
}
</style>
