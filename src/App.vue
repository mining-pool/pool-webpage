<template>
  <v-app>
    <v-app-bar
      app
      fixed
      hide-on-scroll
      dark
    >
      <!-- <v-app-bar-nav-icon /> -->
      <v-icon>mdi-bitcoin</v-icon>
      <v-toolbar-title>{{ config.name }}</v-toolbar-title>

      <v-spacer/>
      <template v-slot:extension>
        <v-tabs
          centered
          fixed-tabs
        >
          <v-tab>Home</v-tab>
          <v-tab>Blocks</v-tab>
          <v-tab>Payments</v-tab>
        </v-tabs>
      </template>
      <v-spacer/>

      <v-text-field
        placeholder="Search Miner Details"
        v-model="username"
        hide-details
        single-line
        clearable
        flat
        append-icon="mdi-bitcoin"
        @keyup.enter="toMinerPage"
      />
    </v-app-bar>

    <v-content app>
      <router-view></router-view>

      <v-speed-dial
        v-model="fab"
        floating
        bottom
        right
        fixed
        direction="top"
        open-on-hover
        transition="scale-transition"
        value="visible"
      >
        <template v-slot:activator>
          <v-btn v-model="fab" color="blue darken-2" dark fab>
            <v-icon v-if="fab">mdi-close</v-icon>
            <v-icon v-else>mdi-plus</v-icon>
          </v-btn>
        </template>
        <v-btn fab dark small color="green">
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
        <v-btn fab dark small color="indigo">
          <v-icon>mdi-plus</v-icon>
        </v-btn>
        <v-btn fab dark small color="red">
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </v-speed-dial>
    </v-content>

    <v-footer app absolute padless>
      <v-col class="text-center">{{ new Date().getFullYear() }} — Made by <a href="https://github.com/maoxs2" target="_blank">Command</a></v-col>
    </v-footer>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import config from './config/config';
// import HelloWorld from './components/HelloWorld.vue';
// import Bar from './components/Bar.vue';

export default Vue.extend({
  name: 'App',

  components: {
    // HelloWorld,
    // Bar,
  },
  data: () => ({
    fab: false,
    username: '',
    config,
  }),
  methods: {
    toMinerPage() {
      this.$router.push({ path: `/miner/${this.username}` });
    },
  },
});
</script>
