import { bitable, IOpenAttachment } from "@lark-opdev/block-bitable-api";
import { ATTACHMENT_FIELD_NAME } from "../config/constants";

/**
 * 飞书多维表格 API 服务
 */

/**
 * 获取当前记录 ID
 */
export async function getCurrentRecordId(): Promise<string> {
  const { recordId } = await bitable.base.getSelection();
  if (!recordId) throw new Error("无法获取记录 ID");
  return recordId;
}

/**
 * 从附件字段获取 Markdown 文件内容
 */
export async function getMarkdownFromAttachment(): Promise<string> {
  try {
    // 1. 获取当前选中的表和记录
    const selection = await bitable.base.getSelection();
    console.log("选区信息:", selection);
    const { tableId, recordId } = selection;
    if (!tableId || !recordId) throw new Error("选区状态读取失败");

    const table = await bitable.base.getTableById(tableId);
    console.log("获取表成功:", tableId);

    // 2. 获取附件字段
    const attachmentField = await table.getFieldByName(ATTACHMENT_FIELD_NAME);
    if (!attachmentField) {
      throw new Error(`找不到字段：${ATTACHMENT_FIELD_NAME}`);
    }
    console.log("附件字段:", attachmentField.id, attachmentField.type);

    // 3. 获取附件单元格值
    const cellValue = await table.getCellValue(attachmentField.id, recordId);
    console.log("单元格原始值:", cellValue);

    // 附件字段可能返回数组或单个对象
    let attachmentValue: IOpenAttachment;

    if (Array.isArray(cellValue)) {
      console.log("附件是数组，长度:", cellValue.length);
      if (cellValue.length === 0) {
        throw new Error("附件字段为空，请先上传 Markdown 文件");
      }
      attachmentValue = cellValue[0] as IOpenAttachment;
    } else if (cellValue && (cellValue as IOpenAttachment).token) {
      attachmentValue = cellValue as IOpenAttachment;
    } else {
      console.log("附件值无效:", typeof cellValue, cellValue);
      throw new Error("附件字段为空或格式错误，请先上传 Markdown 文件");
    }

    if (!attachmentValue.token) {
      throw new Error("附件 token 不存在");
    }

    console.log("附件 token:", attachmentValue.token);

    // 4. 通过 token 获取文件内容
    // 使用 table.getAttachmentUrl 获取下载链接
    const downloadUrl = await table.getAttachmentUrl(attachmentValue.token, attachmentField.id, recordId);
    console.log("附件下载 URL:", downloadUrl);

    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`文件下载失败: ${response.status}`);
    }

    const fileBlob = await response.blob();
    console.log("文件获取成功，大小:", fileBlob.size);

    const fileText = await blobToText(fileBlob);
    console.log("文件内容长度:", fileText.length);

    return fileText;
  } catch (error) {
    console.error("获取附件失败:", error);
    throw error;
  }
}

/**
 * 将 Blob 转换为文本
 */
function blobToText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      reject(new Error("文件读取失败"));
    };
    reader.readAsText(blob);
  });
}

/**
 * 监听记录切换
 */
export function onSelectionChange(callback: () => void): () => void {
  return bitable.base.onSelectionChange(() => {
    callback();
  });
}
