import {
  CodeTabs,
  PythonBlock,
  ShellBlock,
  TypeScriptBlock,
} from './InstructionsWithCode';

import CodeBlock from '@theme/CodeBlock';
import React from 'react';
import TabItem from "@theme/TabItem";
import Tabs from "@theme/Tabs";

export const LangChainInstallationCodeTabs = () => (
  <CodeTabs
    groupId="client-language"
    tabs={[
      {
        value: 'python',
        label: 'pip',
        language: 'bash',
        content: `pip install -U langchain_openai`,
      },
      {
        value: 'typescript',
        label: 'yarn',
        language: 'bash',
        content: `yarn add langchain`,
      },
      {
        value: 'npm',
        label: 'npm',
        language: 'bash',
        content: `npm install -S langchain`,
      },
      {
        value: 'pnpm',
        label: 'pnpm',
        language: 'bash',
        content: `pnpm add langchain`,
      },
    ]}
  />
);

export const ConfigureEnvironmentCodeTabs = ({}) => (
  <CodeTabs
    tabs={[
      ShellBlock(`export LANGCHAIN_TRACING_V2=true
export LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
export LANGCHAIN_API_KEY=<your-api-key>
export LANGCHAIN_PROJECT=<your-project>  # if not specified, defaults to "default"

# The below examples use the OpenAI API, so you will need
export OPENAI_API_KEY=<your-openai-api-key>`),
    ]}
    groupId="client-language"
  />
);

export const LangChainQuickStartCodeTabs = ({}) => {
  const simpleTSBlock = `import { ChatOpenAI } from "langchain/chat_models/openai";\n
const llm = new ChatOpenAI()
await llm.invoke("Hello, world!");`;

  const alternativeTSBlock = `import { Client } from "langsmith";
import { LangChainTracer } from "langchain/callbacks";

const client = new Client({
  apiUrl: "https://api.smith.langchain.com",
  apiKey: "YOUR_API_KEY"
});

const tracer = new LangChainTracer({
  projectName: "YOUR_PROJECT_NAME",
  client
});

const model = new ChatOpenAI({
  openAIApiKey: "YOUR_OPENAI_API_KEY"
});

await model.invoke("Hello, world!", { callbacks: [tracer] })`;

  return (
    <Tabs groupId="client-language">
      <TabItem key="python" value="python" label="Python">
        <CodeBlock className="python" language="python">
          {`from langchain_openai import ChatOpenAI\n
llm = ChatOpenAI()
llm.invoke("Hello, world!")`}
        </CodeBlock>
      </TabItem>
      <TabItem key="typescript" value="typescript" label="TypeScript">
        <CodeBlock className="typescript" language="typescript">
          {simpleTSBlock}
        </CodeBlock>
        <p>For environments where process.env is not defined, initialize by explicitly passing keys:</p>
        <CodeBlock className="typescript" language="typescript">
          {alternativeTSBlock}
        </CodeBlock>
      </TabItem>
    </Tabs>
  );
};


const TraceableQuickStart = PythonBlock(`import datetime
from typing import Any\n
import openai
from openai.openai_object import OpenAIObject
from langsmith.run_helpers import traceable\n\n
@traceable(run_type="llm", name="openai.ChatCompletion.create")
def my_chat_model(*args: Any, **kwargs: Any) -> OpenAIObject:
    return openai.ChatCompletion.create(*args, **kwargs)\n\n
@traceable(run_type="tool")
def my_tool(tool_input: str) -> str:
    return tool_input.upper()\n\n
@traceable(run_type="chain")
def my_chain(prompt: str) -> str:
    messages = [
        {
            "role": "system",
            "content": "You are an AI Assistant. The time is "
            + str(datetime.datetime.now()),
        },
        {"role": "user", "content": prompt},
    ]
    return my_chat_model(model="gpt-3.5-turbo", messages=messages)\n\n
@traceable(run_type="chain")
def my_chat_bot(text: str) -> str:
    generated = my_chain(text)

    if "meeting" in generated:
        return my_tool(generated)
    else:
        return generated\n\n
my_chat_bot("Summarize this morning's meetings.")
# See an example run at: https://smith.langchain.com/public/3e853ad8-77ce-404d-ad4c-05726851ad0f/r`);

export const TraceableQuickStartCodeBlock = ({}) => (
  <CodeBlock
    className={TraceableQuickStart.value}
    language={TraceableQuickStart.language ?? TraceableQuickStart.value}
  >
    {TraceableQuickStart.content}
  </CodeBlock>
);

export const TraceableThreadingCodeBlock = ({}) => (
  <CodeBlock
    className={TraceableQuickStart.value}
    language={TraceableQuickStart.language ?? TraceableQuickStart.value}
  >
    {`import asyncio
import datetime
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Dict, List\n
import openai
from openai.openai_object import OpenAIObject
from langsmith.run_helpers import traceable
from langsmith.run_trees import RunTree\n\n
@traceable(run_type="llm")
def my_llm(prompt: str, temperature: float = 0.0, **kwargs: Any) -> OpenAIObject:
    """Call a completion model."""
    return openai.Completion.create(
        model="gpt-3.5-turbo-instruct", prompt=prompt, temperature=temperature, **kwargs
    )\n\n
@traceable(run_type="chain")
def llm_chain(user_input: str, **kwargs: Any) -> str:
    """Select the text from the openai call."""
    return my_llm(prompt=user_input, **kwargs).choices[0].text\n\n
@traceable(run_type="llm")
def my_chat_model(messages: List[Dict], temperature: float = 0.0, **kwargs: Any) -> OpenAIObject:
    """Call a chat model."""
    return openai.ChatCompletion.create(
        model="gpt-3.5-turbo", messages=messages, temperature=temperature, **kwargs
    )\n\n
@traceable(run_type="chain")
def llm_chat_chain(user_input: str, **kwargs: Any) -> str:
    """Prepare prompt & select first choice response."""
    messages = [
        {
            "role": "system",
            "content": "You are an AI Assistant. The time is "
            + str(datetime.datetime.now()),
        },
        {"role": "user", "content": user_input},
    ]
    return my_chat_model(messages=messages, **kwargs).choices[0].message.content\n\n
@traceable(run_type="chain")
# highlight-next-line
async def nested_chain(text: str, run_tree: RunTree, **kwargs: Any) -> str:
    """Example with nesting and thread pools."""
    futures = []
    with ThreadPoolExecutor() as thread_pool:
        for i in range(2):
            futures.append(
                thread_pool.submit(
                    llm_chain,
                    f"Completion gather {i}: {text}",
                    # highlight-next-line
                    langsmith_extra={"run_tree": run_tree},
                    **kwargs,
                )
            )
        for i in range(2):
            futures.append(
                thread_pool.submit(
                    llm_chat_chain,
                    f"Chat gather {i}: {text}",
                    # highlight-next-line
                    langsmith_extra={"run_tree": run_tree},
                    **kwargs,
                )
            )
    return "\\n".join([future.result() for future in futures])\n\n
asyncio.run(nested_chain("Summarize meeting"))`}
  </CodeBlock>
);

export const RunTreeQuickStartCodeTabs = ({}) => (
  <CodeTabs
    tabs={[
      TraceableQuickStart,
      {
        value: "python-run-tree",
        label: "Python (Run Tree)",
        language: "python",
        content:`from langsmith.run_trees import RunTree\n
parent_run = RunTree(
    name="My Chat Bot",
    run_type="chain",
    inputs={"text": "Summarize this morning's meetings."},
    serialized={}
)\n
child_llm_run = parent_run.create_child(
    name="My Proprietary LLM",
    run_type="llm",
    inputs={
        "prompts": [
            "You are an AI Assistant. Summarize this morning's meetings."
        ]
    },
)\n
child_llm_run.end(outputs={"generations": ["Summary of the meeting..."]})
parent_run.end(outputs={"output": ["The meeting notes are as follows:..."]})\n
res = parent_run.post(exclude_child_runs=False)
res.result()`},
      TypeScriptBlock(`import { RunTree, RunTreeConfig } from "langsmith";\n
const parentRunConfig: RunTreeConfig = {
    name: "My Chat Bot",
    run_type: "chain",
    inputs: {
        text: "Summarize this morning's meetings.",
    },
    serialized: {}
};\n
const parentRun = new RunTree(parentRunConfig);\n
const childLlmRun = await parentRun.createChild({
    name: "My Proprietary LLM",
    run_type: "llm",
    inputs: {
        prompts: [
        "You are an AI Assistant. Summarize this morning's meetings.",
        ],
    },
});\n
await childLlmRun.end({
outputs: {
    generations: [
    "Summary of the meeting...",
    ],
},
});\n
await parentRun.end({
outputs: {
    output: ["The meeting notes are as follows:..."],
},
});\n
// False means post all nested runs as a batch
// (don't exclude child runs)
await parentRun.postRun(false);

  `),
    ]}
    groupId="client-language"
  />
);
