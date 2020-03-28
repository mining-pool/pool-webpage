<template>
  <v-container>
    <p class="display-1 text--primary">Miner Stats</p>
    <v-sheet>
      <v-row>
        <v-col>
          <v-card class="mx-auto">
            <v-list>
              <v-list-item-group v-model="model">
                <v-list-item v-for="(item, i) in minerStats" :key="i">
                  <v-list-item-icon>
                    <v-icon v-text="item.icon" />
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title v-text="item.text" />
                  </v-list-item-content>
                  <v-list-item-action>
                    <v-chip v-text="item.content" />
                  </v-list-item-action>
                </v-list-item>
              </v-list-item-group>
            </v-list>
          </v-card>
        </v-col>

        <v-col>
          <v-card class="mx-auto">
            <v-card-subtitle>Register Payment</v-card-subtitle>
            <v-card-text>
              <v-form ref="form" v-model="valid" :lazy-validation="lazy">
                <v-text-field v-model="paymentMethod" label="Payment Method" required />
                <v-text-field
                  v-model="email"
                  :rules="emailRules"
                  label="Password (E-mail)"
                  required
                />

                <v-btn>Submit</v-btn>
              </v-form>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-sheet>

    <v-expansion-panels class="mb-6">
      <v-expansion-panel v-for="(item,i) in rigs" :key="i">
        <v-expansion-panel-header expand-icon="mdi-menu-down">
          {{item.rigId}}
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit,
          sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          Ut enim ad minim veniam, quis nostrud exercitation
          ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- <div class="row">
      <div class="col-sm l-box text-center">
        <div class="infobox">
          <h4>Agents</h4>
          <p id="agents" />
        </div>
      </div>
      <div class="col-sm l-box">
        <div class="infobox">
          <table class="table">
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Realtime Hs</th>
                <th scope="col">AVG Hs</th>
                <th scope="col">Height</th>
                <th scope="col">Diff</th>
                <th scope="col">Accepted</th>
                <th scope="col">Stale</th>
                <th scope="col">Rejected</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>#</td>
                <td>#</td>
                <td>#</td>
                <td>#</td>
                <td>#</td>
                <td>#</td>
                <td>#</td>
                <td>#</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>-->
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue';
// import HelloWorld from './components/HelloWorld.vue';
// import Bar from './components/Bar.vue';

export default Vue.extend({
  name: 'Miner',

  components: {},
  data: () => ({
    paymentMethod: null,
    minerStats: [
      {
        icon: 'mdi-send',
        text: 'Miner ID',
        content: '',
      },
      {
        icon: 'mdi-inbox',
        text: 'Total Average Hashrate',
        content: 0,
      },
      {
        icon: 'mdi-star',
        text: 'Total Live Hashrate',
        content: 0,
      },
      {
        icon: 'mdi-send',
        text: 'Last Share',
        content: 0,
      },
      {
        icon: 'mdi-send',
        text: 'Rig Count',
        content: 0,
      },
    ],
    rigs: [
      {
        rigId: 'rig12',
        hashrate: 180,
      },
      {
        rigId: 'rig2',
        hashrate: 180,
      },
      {
        rigId: 'rig3',
        hashrate: 180,
      },
    ],
  }),

  methods: {
    dealRouteParams() {
      this.minerStats[0].content = this.$route.params.username;
    },
  },

  watch: {
    $route(to) {
      this.minerStats[0].content = to.params.username;
    },
  },

  created() {
    this.dealRouteParams();
  },
});
</script>
