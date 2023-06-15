<template>
  <div class="container mx-auto py-10">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div
        v-for="(project, index) in projects"
        :key="index"
        class="rounded-lg shadow-lg bg-blue-800 p-6 hover:shadow-xl transition duration-300 ease-in-out"
      >
        <h2 class="text-2xl font-bold mb-4">{{ project.title }}</h2>
        <p class="mb-4">{{ project.description }}</p>
        <div class="flex justify-between items-center">
          <a
            :href="project.githubLink"
            class="text-blue-300 hover:text-blue-400 transition duration-300 ease-in-out"
          >
            <span class="fab fa-github fa-lg mr-2"></span>
            Github
          </a>
          <a
            :href="project.webLink"
            class="text-blue-300 hover:text-blue-400 transition duration-300 ease-in-out"
          >
            <span class="fas fa-external-link-alt fa-lg mr-2"></span>
            Web
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      projects: [

        {
          title: "Is it cold now?",
          description:
            "This is a weather app that tells you if it's cold outside based on your current location",
          githubLink: "https://github.com/Alejocg/weather",
          webLink: "https://isitcoldnow.netlify.app/",
        },
                        {
          title: "Gym Bros",
          description:
            "Gym tracker / Calendar for a group a friends. Using Tailwind, vue and Supabase",
          githubLink: "https://github.com/alejocg/thegymbros",
          webLink: "https://thegymbros.netlify.app/",
        },
        {
          title: "Football Calendar",
          description:
            "Football calendar is an app that tells the next scheduled matches for my favourite teams",
          githubLink: "https://github.com/Alejocg/football",
          webLink: "https://whattowatchnext.netlify.app/",
        },
        {
          title: "Random Excuse Generator",
          description:
            "This is a fun project that generates random excuses for various situations.",
          githubLink: "https://github.com/Alejocg/Random-Excuse-Generator",
          webLink: "https://randomexcusegenerator.netlify.app/",
        },
        {
          title: "Doitfy",
          description:
            "Doitfy is a kanban-style app for tracking projects and tasks. Account creation is needed.",
          githubLink: "https://github.com/Alejocg",
          webLink: "https://doitfy.netlify.app/",
        },
        {
          title: "VIP Conctacts Info",
          description:
            "Simple contact management app using Vue.js.",
          githubLink: "https://github.com/Alejocg/Ironcontacts",
          webLink: "https://vipagendacontact.netlify.app",
        },
      ],
    };
  },
};
</script>
