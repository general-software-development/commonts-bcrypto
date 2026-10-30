import { EJWT } from "./src";

const ejwt = new EJWT("Example", {
    mydata: 2023
}, {});

const token = await ejwt.get_string("mySecret");

console.log(token);
