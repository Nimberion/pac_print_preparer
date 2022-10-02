<template>
	<!-- 	.color1 {color: #000203;}
			.color2 {color: #1f2735;}
			.color3 {color: #c1b4a0;}
			.color4 {color: #e8e2d7;}
			.color5 {color: #f9f9f9;} -->
	<div class="text-center text-sm grid grid-rows-[28px_108px_32px] place-items-center p-4 bg-[#f9f9f9] text-[#000203]">
		<h1 class="text-xl font-bold">PAC Print Preparer</h1>
		<div class="w-full">
			<!-- LOADING BAR -->
			<div v-if="isLoading" class="h-3 w-full border border-[#1f2735] mb-1">
				<div class="h-full bg-[#c1b4a0] text-xs" :style="`width: ${progress}%;`"></div>
			</div>
			<div>{{ msg }}</div>
			<!-- <div :title="argument">{{ argument }}</div> -->
		</div>
		<button
			class="w-28 mx-2 px-2 py-1 border border-[#1f2735] bg-[#c1b4a0] rounded-sm place-content-center flex"
			:class="{ 'hover:bg-[#e8e2d7]': !isLoading }"
			:disabled="isLoading"
			@click="cleanFile"
		>
			<div v-if="!isLoading">{{ btn }}</div>
			<!-- SPINNER -->
			<div v-else class="animate-spin w-5 h-5 border-4 border-b-transparent border-[#e8e2d7] rounded-full" role="status"></div>
			<!-- temp button to abbort needed? -->
		</button>
	</div>
</template>

<script setup lang="ts">
	import { Ref, ref, onMounted } from "vue";
	import { getMatches } from "@tauri-apps/api/cli";
	import { open } from "@tauri-apps/api/dialog";
	import { once } from "@tauri-apps/api/event";
	import { readBinaryFile, writeBinaryFile } from "@tauri-apps/api/fs";
	import { exit } from "@tauri-apps/api/process";
	import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
	import worker from "pdfjs-dist/build/pdf.worker.entry";
	import { PageSizes, PDFDocument } from "pdf-lib";
	import { TextItem } from "pdfjs-dist/types/src/display/api";

	const msg = ref("Ziehe die zu bearbeitende Datei in das Fenster oder wähle sie über den Button aus.");
	const errorMsg = ref("");
	const btn = ref("Starten");
	const filePath = ref("");
	const fileName = ref("");
	const file: Ref<Uint8Array> = ref();
	const changeInformation: Ref<Array<{ index: number; type: string }>> = ref([]);
	const isLoading = ref(false);
	const progress = ref(0);
	const dragAndDropEvent = ref();
	const passedArgumentValue = ref();

	GlobalWorkerOptions.workerSrc = worker;

	onMounted(async () => {
		//SEARCH FOR PASSED ARGUMENTS
		try {
			const matches = await getMatches();
			if (matches.args.path.value) {
				passedArgumentValue.value = matches.args.path.value;
				await cleanFile();
			} else {
				//START DRAG AND DROP LISTENER
				dragAndDropListener();
			}
		} catch (error) {
			msg.value = "Error: Fehler beim Wählen der Datei.";
			resetData();
		}
	});

	function resetData() {
		filePath.value = "";
		fileName.value = "";
		file.value = undefined;
		changeInformation.value = [];
		isLoading.value = false;
		progress.value = 0;
		dragAndDropEvent.value = undefined;
		dragAndDropListener();
		passedArgumentValue.value = undefined;
	}

	async function cleanFile() {
		try {
			isLoading.value = true;
			errorMsg.value = "Fehler beim Wählen der Datei.";
			msg.value = "Wähle die zu bereinigende Datei...";
			await selectFile();
			progress.value = 17;
			errorMsg.value = "Fehler beim Laden der Datei.";
			msg.value = "Datei wird geladen...";
			await readFile();
			progress.value = 39;
			errorMsg.value = "Fehler bei der Suche nach nötigen Änderungen.";
			msg.value = "Suche nach nötigen Änderungen...";
			await getChangeInformation();
			progress.value = 55;
			errorMsg.value = "Fehler beim Vornehmen der Änderungen.";
			msg.value = "Änderungen werden vorgenommen...";
			await editFile();
			progress.value = 79;
			errorMsg.value = "Fehler beim Speichern der neuen Datei.";
			msg.value = "Datei wird gespeichert...";
			await saveFile();
			progress.value = 100;
			errorMsg.value = "";
			msg.value = "Bereinigung der Datei ist abgeschlossen.";
			if (passedArgumentValue.value) {
				await exit();
			}
		} catch (e) {
			console.log(e);

			//custom error type needed??
			if (typeof e === "string") {
				msg.value = `Error: ${e}`;
			} else {
				msg.value = `Error: ${errorMsg.value}`;
			}
		} finally {
			resetData();
			btn.value = "Nochmal";
		}
	}

	async function selectFile() {
		if (passedArgumentValue.value) {
			if (passedArgumentValue.value.slice(-4) === ".pdf") {
				filePath.value = passedArgumentValue.value;
			} else {
				throw "Ungültige Dateiendung.";
			}
		} else if (dragAndDropEvent.value) {
			//PER DRAG AND DROP
			//CHECK IF ONLY ONE FILE WAS DROPPED
			if (dragAndDropEvent.value.payload.length === 1) {
				//CHECK IF ITS AN PDF
				if (dragAndDropEvent.value.payload[0].slice(-4) === ".pdf") {
					filePath.value = dragAndDropEvent.value.payload[0];
				} else {
					throw "Ungültige Dateiendung.";
				}
			} else {
				throw "Es kann nur eine Datei bearbeitet werden.";
			}
		} else {
			//PER BUTTON
			filePath.value = (await open({
				multiple: false,
				filters: [{ name: "PDF", extensions: ["pdf"] }],
				directory: false,
				title: "Öffnen",
				// defaultPath: "",
			})) as string;
		}
		console.log(filePath.value);

		fileName.value = filePath.value.split("\\").at(-1);
	}

	async function readFile() {
		//READ FILE
		file.value = await readBinaryFile(filePath.value);
	}

	async function getChangeInformation() {
		const doc = await getDocument(file.value).promise;

		for (let index = 0; index < doc.numPages - 1; index++) {
			const textContent = ((await (await doc.getPage(index + 1)).getTextContent()).items as Array<TextItem>).map((x) => x.str);

			//CHECK IF VALID PDF
			if (index === 0 && textContent[0] !== "Foto: © Yuri Arcurs – Fotolia.com; Privat") {
				throw "Ungültige Dateistruktur.";
			}

			textContent.splice(0, textContent.length - 1);

			const textContentPageNumbers = textContent[0].match(/[0-9]+/g);

			//FILL CHANGEINFORMATION
			if (!textContent[0].match(/Seite [0-9]+ von [0-9]+/)) {
				changeInformation.value.unshift({ index: index, type: "delete" });
			} else if (textContentPageNumbers[0] === textContentPageNumbers[1] && Number(textContentPageNumbers[1]) % 2 !== 0) {
				changeInformation.value.unshift({ index: index, type: "add" });
			}
		}
	}

	async function editFile() {
		if (changeInformation.value.length > 0) {
			const oldPdf = await PDFDocument.load(file.value);

			changeInformation.value.forEach((item) => {
				if (item.type === "delete") {
					oldPdf.removePage(item.index);
				} else {
					oldPdf.insertPage(item.index + 1, PageSizes.A4);
				}
			});

			//COPIE FILE TO REMOVE PAGE STRUCTURE DATA ERROR
			const newPdf = await oldPdf.copy();

			file.value = await newPdf.save();
		}
	}

	async function saveFile() {
		const newFilePath = filePath.value.replace(".pdf", "_bereinigt.pdf");
		await writeBinaryFile({ path: newFilePath, contents: file.value });
	}

	async function dragAndDropListener() {
		await once<string>("tauri://file-drop", (event) => {
			//triggers multiple times :(
			dragAndDropEvent.value = event;
			cleanFile();
			console.log("filedrop");
		});
	}
</script>
