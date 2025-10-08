import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import xlsx from "xlsx";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

// middleware
app.use(bodyParser.json());
app.use(express.static("public"));

// nama file Excel
const FILE_PATH = "./pendaftaran.xlsx";

// helper untuk simpan data
function simpanDataKeExcel(data) {
  let workbook;
  let worksheet;

  // kalau file sudah ada, baca
  if (fs.existsSync(FILE_PATH)) {
    workbook = xlsx.readFile(FILE_PATH);
    worksheet = workbook.Sheets["Data"];
  } else {
    // kalau belum ada, buat baru
    workbook = xlsx.utils.book_new();
    worksheet = xlsx.utils.json_to_sheet([]);
    xlsx.utils.book_append_sheet(workbook, worksheet, "Data");
  }

  // ubah sheet ke array JSON
  const existingData = xlsx.utils.sheet_to_json(worksheet);

  // batas maksimal 50 peserta
  if (existingData.length >= 50) {
    throw new Error("Pendaftaran sudah penuh (maksimal 50 peserta).");
  }

  // cek duplikat berdasarkan NIM atau email
  if (
    existingData.some(
      (item) => item.NIM === data.nim || item.Email === data.email
    )
  ) {
    throw new Error("Peserta dengan NIM atau Email ini sudah terdaftar.");
  }

  // tambahkan data baru
  existingData.push({
    Nama: data.nama,
    NIM: data.nim,
    WhatsApp: data.hp,
    Email: data.email,
    Asal_Sekolah: data.asal,
    Motivasi: data.motivasi || "",
    Tanggal: new Date().toLocaleString("id-ID"),
  });

  // konversi ke worksheet dan simpan
  const newWorksheet = xlsx.utils.json_to_sheet(existingData);
  workbook.Sheets["Data"] = newWorksheet;
  xlsx.writeFile(workbook, FILE_PATH);
}

// route untuk terima data dari form
app.post("/api/daftar", (req, res) => {
  try {
    simpanDataKeExcel(req.body);
    res.json({ message: "✅ Pendaftaran berhasil disimpan!" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// start server lokal
app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));
