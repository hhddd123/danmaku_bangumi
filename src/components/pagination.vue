<script setup>
import { provide, ref,watch } from 'vue'
import { useSearchStore } from '@/stores/searchVideo'

const searchStore = useSearchStore()

const page = ref(1)

//监听searchStore.website的变化
watch(() => searchStore.website, () => {
    searchStore.changeLength(Math.ceil(searchStore[searchStore.website].length / 12))
})
watch(() => page.value, () => {
    searchStore.changePage(page.value)
})


</script>

<template>
    
</template>


<style scoped></style>