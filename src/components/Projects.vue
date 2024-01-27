<template>
  <div id=projects class="container mx-auto py-10 grid grid-cols-1 lg:grid-cols-1 gap-6">
    <div
      v-for="(project, index) in projects"
      :key="index"
      class=" shadow-lg bg-white p-6 rounded-xl"
    >
      <div class="flex justify-between items-center">
        <div class="flex flex-col">
          <h2 class="text-3xl font-bold mb-2 text-gray-700">{{ project.title }}</h2>
          <p class="text-xl mb-4 text-gray-700">{{ project.description }}</p>
          <div class="flex mt-2">
            <span class="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">{{ project.badge1 }}</span>
            <span class="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 ml-2	">{{ project.badge2 }}</span>
          </div> 
          <div class="flex justify-start mt-4">
            <a :href="project.githubLink" class="text-orange-400 mr-4">
              <span class="fab fa-github fa-lg mr-2"></span>Github
            </a>
            <a :href="project.webLink" class="text-orange-400">
              <span class="fas fa-external-link-alt fa-lg mr-2"></span>Link
            </a>
          </div>
        </div>
        <img :src="project.picture" alt="Project Image" class="w-1/3 rounded-xl shadow-xl	 ml-4" />
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
          title: "Agile Vote",
          description:
            "Real-time, collaborative Scrum poker estimation app that uses firebase functions",
          githubLink: "https://github.com/Alejocg/",
          webLink: "https://agilevote.netlify.app",
          picture: "https://i.imgur.com/2LejGKt.png",
          badge1: "Firestore",
          badge2: "Firebase",

        },
        {
          title: "Japanese For All",
          description:
            "Vue Press-powered site designed to ace the Japanese Proficiency Test (JLPT) with confidence",
          githubLink: "https://github.com/Alejocg",
          webLink: "https://japones.netlify.app/",
          picture: "https://i.imgur.com/jpvQpXr_d.webp?maxwidth=760&fidelity=grand",
          badge1: "Vue Press",
          badge2: "Tailwind",
        },
        {
          title: "Is it cold now?",
          description:
            "App that delivers real-time weather updates based on your current location",
          githubLink: "https://github.com/Alejocg/weather",
          webLink: "https://isitcoldnow.netlify.app/",
          picture: "https://i.imgur.com/BVJW7mT_d.webp?maxwidth=760&fidelity=grand",
          badge1: "Weather API",
          badge2: "Vue",
        },
                        {
          title: "Gym Bros",
          description:
            "Fitness tracking and calendar management made for a group a friends. Built with Tailwind, Vue and Supabase",
          githubLink: "https://github.com/alejocg/thegymbros",
          webLink: "https://thegymbros.netlify.app/",
          picture: "https://i.imgur.com/RPeSHB0_d.webp?maxwidth=760&fidelity=grand",
          badge1: "Supabase",
          badge2: "Vue",
        },
        {
          title: "Football Calendar",
          description:
            "Simple app for staying updated on the upcoming matches for my favorite teams",
          githubLink: "https://github.com/Alejocg/football",
          webLink: "https://whattowatchnext.netlify.app/",
          picture: "https://i.imgur.com/wrSw8fc_d.webp?maxwidth=760&fidelity=grand",
          badge1: "Football-API",
          badge2: "Vue",
        },
        {
          title: "Doitfy",
          description:
            "Doitfy is a kanban-style app for tracking projects and tasks. Account creation is needed.",
          githubLink: "https://github.com/Alejocg",
          webLink: "https://doitfy.netlify.app/",
          picture: "https://i.imgur.com/lhTmjSc_d.webp?maxwidth=760&fidelity=grand",
          badge1: "Supabase",
          badge2: "Vue",
        },
   
      ],
    };
  },
};
</script>
