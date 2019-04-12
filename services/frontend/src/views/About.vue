<template>
<b-container>
  <b-row>
    <b-col></b-col>
    <b-col>
      <b-card title="Om ditspil.dk">
        <p class="card-text">
          Siden er endu ikke live. Vi arbejder på det.
        </p>
        <v-icon name="dice" scale="5" />
      </b-card>
    </b-col>
    <b-col></b-col>
  </b-row>
</b-container>
</template>

<script>
import Icon from 'vue-awesome/components/Icon'
import 'vue-awesome/icons/dice'

export default {
  name: 'about',
  components: {
    'v-icon': Icon
  }
}
</script>

<style scoped>
</style>
