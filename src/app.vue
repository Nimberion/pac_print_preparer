<template>
	<!-- <div class="p-4 text-center">
		<h1 class="text-xl font-bold mb-4">PAC Print Preparer</h1>
		<div class="mb-4">Ziehe die zu bearbeitende Datei in das Fenster oder wähle sie über den Button aus.</div>
		<button class="w-32 mb-4 px-2 py-1 border border-gray-400 bg-gray-300 rounded-sm hover:bg-gray-100" @click="chooseFile">
			Durchsuchen
		</button>
		<div class="text-sm mb-4">
			Datei: <span>{{ foo }}</span>
		</div>
		<button class="w-32 mb-4 px-2 py-1 border border-gray-400 bg-gray-300 rounded-sm hover:bg-gray-100" @click="cleanFile">
			Start
		</button>
	</div> -->
	<Home />
</template>

<script setup lang="ts">
	import Home from "./component/Home.vue";
	// let foo = "bar";

	// function chooseFile() {
	// 	console.log("File choosen");
	// }

	// function cleanFile() {
	// 	console.log("File cleaned");
	// }
</script>
