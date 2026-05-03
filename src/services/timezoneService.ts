
export async function requestTimezoneBigdatacloud(latitude: number, longitude: number) {
    const res = await fetch(
        `https://api.bigdatacloud.net/data/timezone-by-location?latitude=${latitude}&longitude=${longitude}`
    );

    const data = await res.json();
    console.log(data.timezone);
}
