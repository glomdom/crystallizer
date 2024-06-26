import { describe } from "mocha";
import ts from "typescript";
import "should";

import CodeGenerator from "../code-generator"

const TAB_SIZE = 2;
const TAB = " ".repeat(TAB_SIZE);
function testGenerate(sourceCode: string): string {
  const sourceFile = ts.createSourceFile(__filename, sourceCode, ts.ScriptTarget.ES2015);
  return new CodeGenerator(sourceFile, true, TAB_SIZE)
    .generate()
    .split("\n")
    .filter(line => line.trim() !== "")
    .join("\n");
}

describe("CodeGenerator", () => {
  describe("#generate", () => {
    describe("should transpile literals", () => {
      it("basic datatypes", () => {
        testGenerate("69.420").should.equal("69.42");
        testGenerate("'hello world!'").should.equal("'hello world!'");
        testGenerate("false && true").should.equal('false && true');
      });
      it("arrays", () => {
        testGenerate("const a: i32[] = [1,2,3]")
          .should.equal("a : TsArray(Int32) = TsArray.new([1, 2, 3] of Int32)");
      });
      it("objects", () => {
        testGenerate("const t = {epic: true, typescript: false}")
          .should.equal(`t = {\n${TAB}"epic" => true,\n${TAB}"typescript" => false\n}`);
      });
    });
    describe("should transpile functions", () => {
      it("regular", () => {
        testGenerate([
          "function saySomething(): void {",
          TAB + "console.log(\"something\");",
          "}"
        ].join("\n")).should.equal([
          "private def saySomething : Nil",
          TAB + "puts(\"something\")",
          TAB + "return",
          "end"
        ].join("\n"));
      });
      it("with generics", () => {
        testGenerate([
          "function printValue<T>(value: T): void {",
          TAB + "console.log(value);",
          "}"
        ].join("\n")).should.equal([
          "private def printValue(value : T) : Nil forall T",
          TAB + "puts(value)",
          TAB + "return",
          "end"
        ].join("\n"));
      });
      it("with a rest parameter", () => {
        testGenerate([
          "function print(...messages: string[]): void {",
          TAB + "console.log(...messages);",
          "}"
        ].join("\n")).should.equal([
          "private def print(*messages : String) : Nil",
          TAB + "puts(*messages)",
          TAB + "return",
          "end"
        ].join("\n"));
      });
      it("asynchronous", () => {
        testGenerate([
          "async function doSomething(): void {",
          TAB + "console.log(\"doing something\");",
          "}",
          "doSomething();"
        ].join("\n")).should.equal([
          "private def doSomething : Nil",
          TAB + "async! do",
          TAB + TAB + "puts(\"doing something\")",
          TAB + TAB + "return",
          TAB + "end",
          "end",
          "await doSomething"
        ].join("\n"));
      });
    });
    describe("should transpile classes", () => {
      it("without generics", () => {
        testGenerate([
          "class Rect {",
          TAB + "public constructor(",
          TAB + TAB + "public readonly width: number,",
          TAB + TAB + "public readonly height: number",
          TAB + ") {}",
          TAB + "public area(): number {",
          TAB + TAB + "return this.width * this.height;",
          TAB + "}",
          "}"
        ].join("\n")).should.equal([
          "private class Rect",
          TAB + "def initialize(@width : Num, @height : Num)",
          TAB + TAB + "return",
          TAB + "end",
          TAB + "def area : Num",
          TAB + TAB + "return @width * @height",
          TAB + "end",
          TAB + "property width : Num",
          TAB + "property height : Num",
          "end"
        ].join("\n"));
      });
      it("with generics", () => {
        testGenerate([
          "class Rect<T> {",
          TAB + "public constructor(",
          TAB + TAB + "public readonly width: T,",
          TAB + TAB + "public readonly height: T",
          TAB + ") {}",
          TAB + "public area(): T {",
          TAB + TAB + "return this.width * this.height;",
          TAB + "}",
          "}"
        ].join("\n")).should.equal([
          "private class Rect(T)",
          TAB + "def initialize(@width : T, @height : T)",
          TAB + TAB + "return",
          TAB + "end",
          TAB + "def area : T",
          TAB + TAB + "return @width * @height",
          TAB + "end",
          TAB + "property width : T",
          TAB + "property height : T",
          "end"
        ].join("\n"));
      });
    });
  });
});