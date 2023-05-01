<template>
  <div class="bg-indigo-900 text-white min-h-screen">
    <Header />
    <Hero />
    <Projects />
    <Footer />
  </div>
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

/* Additional styles */
a:hover {
  text-decoration: underline;
}
/* Add hover effect to project cards */
.rounded-lg:hover {
  transform: scale(1.05);
}
</style>
