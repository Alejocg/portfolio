<template>
  <div id="app">
    <WeatherApp />
    <Footer />
  </div>
</template>

<script>
import WeatherApp from "./components/WeatherApp.vue";
import Footer from './components/Footer.vue';

export default {
  name: "App",
  components: {
    WeatherApp,
    Footer,
  },
};
</script>
