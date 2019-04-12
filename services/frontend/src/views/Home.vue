<template>
<b-jumbotron header="Ditspil.dk" lead="Siden er ikke live endnu.">
  <v-icon name="dice" scale="10" />
</b-jumbotron>
</template>

<script>
import Icon from 'vue-awesome/components/Icon'
import 'vue-awesome/icons/dice'

export default {
  name: 'home',
  components: {
    'v-icon': Icon
  }
}
</script>

<style scoped>
</style> 
