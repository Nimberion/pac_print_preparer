<template>
	<div class="text-center text-sm grid grid-rows-[28px_108px_32px] place-items-center p-4">
		<h1 class="text-xl font-bold">PAC Print Preparer</h1>

		<div v-if="fileName" class="text-sm">
			<div>Datei:</div>
			<div>{{ fileName }}</div>
		</div>
		<div v-else class="">Ziehe die zu bearbeitende Datei in das Fenster oder wähle sie über den Button aus.</div>
		<div>
			<button class="w-28 mx-2 px-2 py-1 border border-gray-400 bg-gray-300 rounded-sm hover:bg-gray-100" @click="selectFile">
				Öffnen</button
			><button class="w-28 mx-2 px-2 py-1 border border-gray-400 bg-gray-300 rounded-sm hover:bg-gray-100" @click="cleanFile">
				Starten
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref } from "vue";
	import { open } from "@tauri-apps/api/dialog";
	import { readBinaryFile, BaseDirectory, readDir } from "@tauri-apps/api/fs";
	import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
	// import * as pdfjsLib from "pdfjs-dist/build/pdf";
	import worker from "pdfjs-dist/build/pdf.worker.entry";
	// pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');

	const pdfPath = ref("test");
	const fileName = ref("");
	const file = ref();
	// GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
	GlobalWorkerOptions.workerSrc = worker;

	async function selectFile() {
		console.log("chose");
		pdfPath.value = (await open({
			multiple: false,
			filters: [{ name: "PDF", extensions: ["pdf"] }],
			directory: false,
			title: "Öffnen",
			// defaultPath: "",
		})) as string;

		// console.log(readDir(""));

		console.log(pdfPath.value);

		fileName.value = pdfPath.value.split("\\").at(-1);

		file.value = await readBinaryFile(pdfPath.value);

		getItems(file.value);

		// console.log(file.value);
		fileName.value = file.value;
	}

	async function getContent(src: Uint8Array, number: number) {
		const doc = await getDocument(src).promise;
		const page = await doc.getPage(number); //doc.numPages
		return await page.getTextContent();
	}

	async function getItems(src: Uint8Array) {
		for (let index = 0; index < 8; index++) {
			const content = await getContent(src, index + 1);
			// const items = content.items.map((item) => {
			// 	console.log(item);
			// });
			// return items;
			console.log(content.items);
		}
	}

	function cleanFile() {
		console.log("clean");
	}
</script>
