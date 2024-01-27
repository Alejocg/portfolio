<template>
  <div class="bg-orange-100 text-white min-h-screen font-mono">
    <Header />
    <Hero />
    <Projects />
    
  </div>
  <Footer />
</template>
<script>
import Header from "./components/Header.vue";
import Footer from "./components/Footer.vue";
import Hero from "./components/Hero.vue";
import Projects from "./components/Projects.vue";

export default {
  name: "App",
  components: {
    Header,
    Footer,
    Hero,
    Projects,
  },
};
</script>
<style>
@import url("https://pro.fontawesome.com/releases/v5.10.0/css/all.css");
 
</style>
