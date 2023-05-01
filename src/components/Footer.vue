<template>
  <footer class="bg-blue-950">
    <div
      class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center"
    >
      <div>
        <p class="text-white text-sm">
          Made by Alejo with <i class="fas fa-heart text-red-500"></i>
        </p>
      </div>
      <div>
        <a
          href="https://github.com/alejocg"
          target="_blank"
          rel="noopener"
          class="text-blue-100 hover:text-white"
        >
          <i class="fab fa-github fa-lg mx-3"></i>
        </a>
        <a
          href="https://www.linkedin.com/in/alejocg"
          target="_blank"
          rel="noopener"
          class="text-blue-100 hover:text-white"
        >
          <i class="fab fa-linkedin fa-lg mx-3"></i>
        </a>
      </div>
    </div>
  </footer>
</template>

<script>
import { faGithub, faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { faHeart } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

export default {
  name: "Footer",
  components: {
    FontAwesomeIcon,
  },
  data() {
    return {
      heartIcon: faHeart,
      githubIcon: faGithub,
      linkedinIcon: faLinkedin,
    };
  },
};
</script>
