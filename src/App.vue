<template>
  <div class="bg-blue-900 text-white min-h-screen">
    <div class="container mx-auto py-10">
      <h1 class="text-3xl font-bold mb-6">Welcome to my Portfolio!</h1>
      <h2 class="text-l font-bold mb-6">

Welcome to my portfolio! My name is Alejo and I'm a Product Owner with a passion for creating small projects that challenge me and help me learn new skills. Although I'm not a developer by trade, I enjoy exploring new technologies and experimenting with code to bring my ideas to life.
</h2>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          class="rounded-lg shadow-lg bg-blue-800 p-6 hover:shadow-xl transition duration-300 ease-in-out"
        >
          <h2 class="text-2xl font-bold mb-4">Is it cold now?</h2>
          <p class="mb-4">
            This is a weather app that tells you if it's cold outside based on
            your current location.
          </p>
          <div class="flex justify-between items-center">
            <a
              href="https://github.com/Alejocg/weather"
              class="text-blue-300 hover:text-blue-400 transition duration-300 ease-in-out"
            >
              <span class="fab fa-github fa-lg mr-2"></span>
              Github
            </a>
            <a
              href="https://isitcoldnow.netlify.app/"
              class="text-blue-300 hover:text-blue-400 transition duration-300 ease-in-out"
            >
              <span class="fas fa-external-link-alt fa-lg mr-2"></span>
              Web
            </a>
          </div>
        </div>
        <div
          class="rounded-lg shadow-lg bg-blue-800 p-6 hover:shadow-xl transition duration-300 ease-in-out"
        >
          <h2 class="text-2xl font-bold mb-4">Random Excuse Generator</h2>
          <p class="mb-4">
            This is a fun project that generates random excuses for various
            situations.
          </p>
          <div class="flex justify-between items-center">
            <a
              href="https://github.com/Alejocg/Random-Excuse-Generator"
              class="text-blue-300 hover:text-blue-400 transition duration-300 ease-in-out"
            >
              <span class="fab fa-github fa-lg mr-2"></span>
              Github
            </a>
            <a
              href="https://randomexcusegenerator.netlify.app/"
              class="text-blue-300 hover:text-blue-400 transition duration-300 ease-in-out"
            >
              <span class="fas fa-external-link-alt fa-lg mr-2"></span>
              Web
            </a>
          </div>
        </div>
        <div
          class="rounded-lg shadow-lg bg-blue-800 p-6 hover:shadow-xl transition duration-300 ease-in-out"
        >
          <h2 class="text-2xl font-bold mb-4">Doitfy</h2>
          <p class="mb-4">
            Doitfy is a kanban-style app for tracking projects and tasks. Account creation is needed.
          </p>
          <div class="flex justify-between items-center">
            <a
              href="https://github.com/Alejocg"
              class="text-blue-300 hover:text-blue-400 transition duration-300 ease-in-out"
            >
              <span class="fab fa-github fa-lg mr-2"></span>
              Github
            </a>
            <a
              href="https://doitfy.netlify.app/"
              class="text-blue-300 hover:text-blue-400 transition duration-300 ease-in-out"
            >
              <span class="fas fa-external-link-alt fa-lg mr-2"></span>
              Web
            </a>
          </div>
        </div>
       
        <div
          class="rounded-lg shadow-lg bg-blue-800 p-6 hover:shadow-xl transition duration-300 ease-in-out"
        >
          <h2 class="text-2xl font-bold mb-4">VIP Agenda Contacts</h2>
          <p class="mb-4">
            VIP Agenda Contacts is a fake agenda that plays with arrays and
            information.
          </p>
          <div class="flex justify-between items-center">
            <a
              href="https://github.com/Alejocg"
              class="text-blue-300 hover:text-blue-400 transition duration-300 ease-in-out"
            >
              <span class="fab fa-github fa-lg mr-2"></span>
              Github
            </a>
            <a
              href="https://vipagendacontact.netlify.app/"
              class="text-blue-300 hover:text-blue-400 transition duration-300 ease-in-out"
            >
              <span class="fas fa-external-link-alt fa-lg mr-2"></span>
              Web
            </a>
          </div>
        </div>
        <div
          class="rounded-lg shadow-lg bg-blue-800 p-6 hover:shadow-xl transition duration-300 ease-in-out"
        >
          <h2 class="text-2xl font-bold mb-4">Wiki Country Info</h2>
          <p class="mb-4">
            Wiki Country Info is a page to get information on different
            countries.
          </p>
          <div class="flex justify-between items-center">
            <a
              href="https://github.com/Alejocg/"
              class="text-blue-300 hover:text-blue-400 transition duration-300 ease-in-out"
            >
              <span class="fab fa-github fa-lg mr-2"></span>
              Github
            </a>
            <a
              href="https://wikicountryinfo.netlify.app/"
              class="text-blue-300 hover:text-blue-400 transition duration-300 ease-in-out"
            >
              <span class="fas fa-external-link-alt fa-lg mr-2"></span>
              Web
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: "App",
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
