import {Card, CardHeader, CardBody, CardFooter} from "@heroui/card";
import {Input} from "@heroui/input";
import {Button} from "@heroui/button";

export default function AIAgent() {
  return (
    <div className="h-full flex flex-col">
      <CardHeader className="flex-none">
        <h2 className="text-xl font-semibold">AI Agent</h2>
      </CardHeader>
      <CardBody className="flex-1 p-4 flex flex-col">
        <div className="flex-1 overflow-y-auto mb-4">
          {/* Chat messages will go here */}
        </div>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Ask AI for help..."
          />
          <Button>
            Send
          </Button>
        </div>
      </CardBody>
    </div>
  );
} 