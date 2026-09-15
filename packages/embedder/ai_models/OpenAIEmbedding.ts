import OpenAI from 'openai'
import {AbstractEmbeddingsModel, type EmbeddingModelParams} from './AbstractEmbeddingsModel'
import {type ModelId, modelIdDefinitions} from './modelIdDefinitions'

export class OpenAIEmbedding extends AbstractEmbeddingsModel {
  client: OpenAI
  url: string
  modelId: ModelId
  constructor(modelId: ModelId, url: string, maxTokens: number) {
    super(modelId, url, maxTokens)
    this.url = url
    this.modelId = modelId as ModelId
    this.client = new OpenAI({
      apiKey: 'vllm',
      baseURL: url
    })
  }

  async ready() {
    return true
  }
  async getTokens(content: string) {
    if (!content) return []
    const tokenizeUrl = `${this.url.replace(/\/v1\/?$/, '')}/tokenize`
    const res = await fetch(tokenizeUrl, {
      method: 'post',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({model: this.modelId, prompt: content, content})
    })
    const {tokens} = await res.json()
    return tokens
  }

  public async getEmbedding(content: string): Promise<number[] | Error> {
    const {data} = await this.client.embeddings.create({
      input: content,
      model: this.modelId
    })
    return data[0]?.embedding ?? []
  }

  protected constructModelParams(modelId: ModelId): EmbeddingModelParams {
    const modelParams = modelIdDefinitions[modelId]
    if (!modelParams) throw new Error(`Unknown modelId ${modelId} for OpenAIEmbedding`)
    return modelParams
  }
}

export default OpenAIEmbedding
