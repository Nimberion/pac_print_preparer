<template>
	<div class="text-center text-sm grid grid-rows-[28px_108px_32px] place-items-center p-4">
		<h1 class="text-xl font-bold">PAC Print Preparer</h1>

		<div v-if="fileName" class="text-sm">
			<div>Datei:</div>
			<div>{{ fileName }}</div>
		</div>
		<div v-else class="">Ziehe die zu bearbeitende Datei in das Fenster oder wähle sie über den Button aus.</div>
		<div>
			<!-- <button class="w-28 mx-2 px-2 py-1 border border-gray-400 bg-gray-300 rounded-sm hover:bg-gray-100" @click="selectFile">
				Öffnen</button> -->
			<button class="w-28 mx-2 px-2 py-1 border border-gray-400 bg-gray-300 rounded-sm hover:bg-gray-100" @click="cleanFile">
				Starten
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { Ref, ref } from "vue";
	import { open } from "@tauri-apps/api/dialog";
	import { readBinaryFile, writeBinaryFile } from "@tauri-apps/api/fs";
	import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
	import worker from "pdfjs-dist/build/pdf.worker.entry";
	import { PageSizes, PDFDocument } from "pdf-lib";
	import { TextItem } from "pdfjs-dist/types/src/display/api";

	const filePath = ref("") as Ref<string>;
	const fileName = ref("") as Ref<string>;
	const file = ref() as Ref<Uint8Array>;
	const changeInformation = ref([]) as Ref<Array<{ index: number; type: string }>>;
	GlobalWorkerOptions.workerSrc = worker;

	async function cleanFile() {
		//RESET VALUES
		filePath.value = "";
		fileName.value = "";
		file.value = undefined;
		changeInformation.value = [];

		console.log("clean File started");
		await selectFile();
		console.log("Lade gewählte Datei.");
		await readFile();
		console.log("finished selectFile");
		console.log("Suche nach nötigen Änderungen.");
		await getChangeInformation();
		console.log("finished getChangeInformation");
		console.log("Anpassung der Datei.");
		await editFile();
		console.log("finished editPdf");
		console.log("Speicher die Datei.");
		await saveFile();
		console.log("finished savePdf");
	}

	async function selectFile() {
		//GET FILE PATH
		filePath.value = (await open({
			multiple: false,
			filters: [{ name: "PDF", extensions: ["pdf"] }],
			directory: false,
			title: "Öffnen",
			// defaultPath: "",
		})) as string;

		console.log(filePath.value);

		//GET FILE NAME
		fileName.value = filePath.value.split("\\").at(-1);
	}

	async function readFile() {
		//READ FILE
		file.value = await readBinaryFile(filePath.value);
	}

	async function getChangeInformation() {
		const doc = await getDocument(file.value).promise;
		const fileContent = [];

		console.log(doc.numPages);

		for (let index = 0; index < doc.numPages; index++) {
			const textContent = ((await (await doc.getPage(index + 1)).getTextContent()).items as Array<TextItem>).map((x) => x.str);

			//CHECK IF VALID PDF
			if (index === 0 && textContent[0] !== "Foto: © Yuri Arcurs – Fotolia.com; Privat") {
				console.log("Ungültige Datei");
				break;
			}

			//CHECK IF LAST PAGE
			if (index !== doc.numPages - 1) {
				textContent.splice(0, textContent.length - 1);
			} else {
				textContent.splice(0, textContent.length - 3);
				console.log(textContent);
			}

			const textContentPageNumbers = textContent[0].match(/[0-9]+/g);

			//FILL CHANGEINFORMATION
			if (!textContent[0].match(/Seite [0-9]+ von [0-9]+/)) {
				changeInformation.value.unshift({ index: index, type: "delete" });
			} else if (textContentPageNumbers[0] === textContentPageNumbers[1] && Number(textContentPageNumbers[1]) % 2 !== 0) {
				changeInformation.value.unshift({ index: index, type: "add" });
			}

			//temp
			fileContent.push(textContent[0]);
		}
		//temp
		// console.log(changeInformation.value);
		// console.log(fileContent);
	}

	async function editFile() {
		if (changeInformation.value.length > 0) {
			const pdfDoc = await PDFDocument.load(file.value);

			changeInformation.value.forEach((item) => {
				if (item.type === "delete") {
					pdfDoc.removePage(item.index);
				} else {
					pdfDoc.insertPage(item.index + 1, PageSizes.A4);
				}
			});

			file.value = await pdfDoc.save();
		}
	}

	async function saveFile() {
		const newFilePath = filePath.value.replace(".pdf", "_bereinigt.pdf");
		await writeBinaryFile({ path: newFilePath, contents: file.value });
	}
</script>
