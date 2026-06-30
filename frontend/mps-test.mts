import { detectStream } from './src/components/resources/curriculum'
const cases: [string,string][] = [
  // real MPS names (no stream word, only section)
  ['XI-A1','science'],['XI-B1','science'],['XI-C','science'],['XI-N','science'],
  ['XI-COM1','commerce'],['XI-COM2','commerce'],['XII-COM','commerce'],['XI-HUM','arts'],
  // explicitly-marked names must still work + computer must NOT be commerce
  ['XI-Sci-A','science'],['XI-PCM-A','science'],['XI-PCB-A','pcb'],['XI-Bot-A','pcb'],
  ['XI-Com-1','commerce'],['XII-Commerce','commerce'],['XI-Hum-A','arts'],['XI-Arts','arts'],
  ['XI-Computer','general'],['XI-CompSci','general'],
]
let bad = 0
for (const [name, want] of cases) {
  const got = detectStream(name)
  const ok = got === want
  if (!ok) bad++
  console.log(`${ok?'✓':'✗'} ${name.padEnd(14)} = ${got.padEnd(9)} ${ok?'':'(want '+want+')'}`)
}
console.log(bad===0 ? '\nALL OK' : `\n${bad} FAILURES`)
