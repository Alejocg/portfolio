<template>
  
  <nav class="bg-orange-100">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center py-4 md:justify-start md:space-x-10">
        <div class="lg:w-0 lg:flex-1">
          <a href="/" class="font-bold text-gray-700 text-2xl"> My Portfolio</a>
        </div>
        <div class="-mr-2 -my-2 md:hidden">
      <button @click="toggleMenu" type="button" class="inline-flex items-center justify-center p-2 rounded-md text-gray-900 hover:text-black hover:bg-gray-800 focus:outline-none focus:bg-gray-800 focus:text-black transition duration-150 ease-in-out"
        aria-expanded="false">
        <svg :class="{ hidden: isOpen, block: !isOpen }" class="h-6 w-6" stroke="currentColor" fill="none"
          viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
        <svg :class="{ hidden: !isOpen, block: isOpen }" class="h-6 w-6" stroke="currentColor" fill="none"
          viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
        <div class="hidden md:flex items-center justify-end md:flex-1 lg:w-0 ">
          <a href="#projects" class="font-medium text-gray-800 hover:font-bold px-4 py-2 rounded-md">Projects</a>

          <a href="https://www.linkedin.com/in/alejocg"
            class="font-medium text-gray-800 hover:font-bold px-4 py-2 mr-3 rounded-md">Contact</a>
          <a href="https://www.linkedin.com/in/alejocg" target="_blank"
            class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-base leading-6 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition ease-in-out duration-150">
            <i class="fab fa-linkedin fa-lg mr-3"></i>

            <span>Linkedin</span>
          </a>
        </div>
      </div>
    </div>

    <div v-show="isOpen" class="block md:hidden">
      <div class="px-2 pt-2 pb-3 sm:px-3">
        <a href="/" class="font-medium text-black hover:text-gray-300 block px-3 py-2 rounded-md">Projects</a>
        <a href="https://www.linkedin.com/in/alejocg" class="font-medium text-black hover:text-gray-300 block px-3 py-2 rounded-md">Contact</a>
        <a href="https://www.linkedin.com/in/alejocg" target="_blank" class="font-medium text-black hover:text-gray-300 block px-3 py-2 rounded-md">
          <span>Linkedin</span>
        </a>
      </div>
    </div>
  </nav>
</template>

<script>
import { faGithub, faLinkedin } from "@fortawesome/free-brands-svg-icons";

export default {
  name: "Header",
  data() {
    return {
      isOpen: false,
      githubIcon: faGithub,
      linkedinIcon: faLinkedin,
    };
  },
  methods: {
    toggleMenu() {
      this.isOpen = !this.isOpen;
    },
  },
};
</script>
