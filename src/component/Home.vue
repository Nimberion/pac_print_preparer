<template>
	<div class="p-4 text-center text-sm">
		<h1 class="text-xl font-bold mb-4">PAC Print Preparer</h1>

		<div v-if="fileName" class="text-sm mb-4">
			<div>Datei:</div>
			<div>{{ fileName }}</div>
		</div>
		<div v-else class="mb-4">Ziehe die zu bearbeitende Datei in das Fenster oder wähle sie über den Button aus.</div>
		<div>
			<button class="w-28 mb-4 mx-2 px-2 py-1 border border-gray-400 bg-gray-300 rounded-sm hover:bg-gray-100" @click="selectFile">
				Öffnen</button
			><button class="w-28 mb-4 mx-2 px-2 py-1 border border-gray-400 bg-gray-300 rounded-sm hover:bg-gray-100" @click="cleanFile">
				Starten
			</button>
		</div>
	</div>
</template>

<script lang="ts">
	import { defineComponent } from "vue";
	import { open } from "@tauri-apps/api/dialog";

	export default defineComponent({
		name: "Home",
		components: {},
		data() {
			return {
				pdfPath: "test",
				fileName: undefined,
				// .split("\")
			};
		},
		methods: {
			async selectFile() {
				console.log("chose");
				const files = await open({
					multiple: false,
					filters: [{ name: "PDF", extensions: ["pdf"] }],
					directory: false,
					title: "Öffnen",
				}).then((data) => {
					console.log(data);
					this.pdfPath = data;
					this.fileName = this.pdfPath.split("\\")[this.pdfPath.split("\\").length - 1];
				});
			},
			cleanFile() {
				console.log("clean");
			},
		},
	});
</script>
