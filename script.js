const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: true });

async function loadAndClip() {
    const url = document.getElementById('videoUrl').value;
    if (!url) {
        alert('Masukkan link video!');
        return;
    }

    // Muat FFmpeg jika belum
    if (!ffmpeg.isLoaded()) {
        await ffmpeg.load();
    }

    // Ambil file video (untuk demo, asumsikan URL langsung; untuk YouTube, gunakan proxy atau API)
    const videoResponse = await fetch(url);
    const videoBlob = await videoResponse.blob();
    ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(videoBlob));

    // Potong video menjadi 1 menit pertama (0-60 detik)
    await ffmpeg.run('-i', 'input.mp4', '-t', '60', '-c', 'copy', 'output.mp4');

    // Baca hasil
    const data = ffmpeg.FS('readFile', 'output.mp4');
    const blob = new Blob([data.buffer], { type: 'video/mp4' });
    const urlBlob = URL.createObjectURL(blob);

    // Tampilkan di player dan siapkan download
    document.getElementById('videoPlayer').src = urlBlob;
    const downloadLink = document.getElementById('downloadLink');
    downloadLink.href = urlBlob;
    downloadLink.style.display = 'block';
}
