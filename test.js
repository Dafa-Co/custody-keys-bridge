function delayedString(index) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const currentDate = new Date();
      resolve(`Current date: ${currentDate.getSeconds()} for  index ${index}`);
    }, 1000); // 1000 ms = 1 second
  });
}

const arr = Array.from({ length: 5 });

// arr.forEach(async (_, index) => {
//     const result = await delayedString();
//     console.log(result);
// });

async function test() {
  for (let element in arr) {
    const result = await delayedString(element);
    console.log(result);
  }
}

test();
