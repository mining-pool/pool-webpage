<template>
  <v-container>
    <v-sheet>
      <v-row>
        <v-col>
          <p class="display-1 text--primary">Pool Status</p>
          <v-card class="mx-auto">
            <v-list>
              <v-list-item-group v-model="model">
                <v-list-item v-for="(item, i) in stats" :key="i">
                  <v-list-item-icon>
                    <v-icon v-text="item.icon"/>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title v-text="item.text"/>
                  </v-list-item-content>
                  <v-list-item-action>
                    <v-chip v-text="item.number"/>
                  </v-list-item-action>
                </v-list-item>
              </v-list-item-group>
            </v-list>
          </v-card>
        </v-col>

        <v-col>
          <p class="display-1 text--primary">Algorithms Status</p>
          <v-card class="mx-auto">
            <v-list>
              <v-list-item-group v-model="model">
                <v-list-item v-for="(item, i) in algorithms" :key="i">
                  <v-list-item-icon>
                    <v-icon v-text="item.icon"></v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title v-text="item.text"></v-list-item-title>
                  </v-list-item-content>
                  <v-list-item-action>
                    <v-chip v-text="item.number"></v-chip>
                  </v-list-item-action>
                </v-list-item>
              </v-list-item-group>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </v-sheet>

    <p class="display-1 text--primary">Quick Start</p>
    <v-card class="mx-auto">
      <v-container>
        <v-row justify="space-around">
          <div v-html="quickstart" />
        </v-row>
      </v-container>
    </v-card>
  </v-container>
</template>

<script>
// // @ is an alias to /src
// import HelloWorld from '@/components/HelloWorld.vue';
import quickstart from '@/config/quickstart.md';

export default {
  name: 'Home',
  components: {
    // HelloWorld,
  },
  data: () => ({
    stats: [
      {
        icon: 'mdi-inbox',
        text: 'Connected Peers',
        number: 0,
      },
      {
        icon: 'mdi-star',
        text: 'Block Height',
        number: 0,
      },
      {
        icon: 'mdi-send',
        text: 'Blocks Found',
        number: 0,
      },
    ],

    algorithms: [
      {
        icon: 'mdi-alphabet-latin',
        text: 'Cukatoo',
        number: 0,
      },
      {
        icon: 'mdi-alphabet-latin',
        text: 'ProgPow',
        number: 0,
      },
      {
        icon: 'mdi-alphabet-latin ',
        text: 'RandomX',
        number: 0,
      },
    ],

    quickstart,
  }),
};
</script>
